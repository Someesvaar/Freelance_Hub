# This file contains the core business logic for ranking bids.
# It is designed to be imported by routes.py.

from app.models import User, Project, Bid

# --- Weights Configuration ---
BASE_WEIGHTS = {
    "price": 0.25,
    "rating": 0.25,
    "completion_rate": 0.15,
    "on_time_rate": 0.15,
    "skill_match": 0.15,
    "portfolio_score": 0.05,
    "timeline": 0.10
}
_total = sum(BASE_WEIGHTS.values())
BASE_WEIGHTS = {k: v / _total for k, v in BASE_WEIGHTS.items()}

# --- Helper Functions ---

def jaccard_skill_match(project_skills, freelancer_skills):
    """Calculates Jaccard similarity between two lists of skills."""
    if not project_skills:
        return 0.5  # If no skills required, it's a neutral match
    ps = set([s.strip().lower() for s in project_skills])
    fs = set([s.strip().lower() for s in freelancer_skills])
    inter = ps.intersection(fs)
    union = ps.union(fs)
    return len(inter) / len(union) if union else 0.0


def normalize_feature_list(feature_values, invert=False):
    """Applies Min-Max scaling to a list of values."""
    if not feature_values:
        return []
    lo, hi = min(feature_values), max(feature_values)
    if hi == lo:
        return [0.5 for _ in feature_values]  # All values are the same
    
    norm = []
    for v in feature_values:
        scaled = (v - lo) / (hi - lo)
        norm.append(1 - scaled if invert else scaled)
    return norm


def adjust_weights_for_priority(priority):
    """Boosts weights based on priority and re-normalizes."""
    w = BASE_WEIGHTS.copy()
    boost = 0.25  # Extra weight boost for chosen priority

    if priority == "price":
        w["price"] += boost
    elif priority == "time":
        w["timeline"] += boost
    elif priority == "ratings":
        w["rating"] += boost
    # "balanced" or other uses default BASE_WEIGHTS

    # Normalize again
    total = sum(w.values())
    return {k: v / total for k, v in w.items()}


def compute_features_for_bid(bid, freelancer, project):
    """
    Extracts raw feature values from the DB models.
    """
    features = {}
    features["price"] = float(bid.amount)
    # Use a default timeline (e.g., 30 days) if not provided
    features["timeline"] = float(bid.proposed_timeline_days or 30) 
    
    # Freelancer stats
    features["rating"] = float(freelancer.avg_rating or 0) / 5.0 # Normalize 0-5 scale to 0-1
    features["completion_rate"] = float(freelancer.completion_rate or 0)
    features["on_time_rate"] = float(freelancer.on_time_rate or 0)
    features["portfolio_score"] = float(freelancer.portfolio_score or 0)

    # Skill match
    project_skills = project.required_skills.split(',') if project.required_skills else []
    freelancer_skills = freelancer.skills.split(',') if freelancer.skills else []
    features["skill_match"] = jaccard_skill_match(project_skills, freelancer_skills)
    
    return features

# --- Main Ranking Function ---

def calculate_ranked_bids(project, bids, priority='balanced'):
    """
    The main logic function.
    Takes DB objects and a priority string, returns a dictionary with
    weights and a list of ranked bid data.
    """
    
    # --- Step 1: Compute raw features ---
    per_bid_data = []
    freelancers = {} # Cache freelancers
    
    for bid in bids:
        if bid.freelancer_id not in freelancers:
            freelancers[bid.freelancer_id] = User.query.get(bid.freelancer_id)
        
        freelancer = freelancers[bid.freelancer_id]
        if not freelancer:
            continue
            
        features = compute_features_for_bid(bid, freelancer, project)
        per_bid_data.append({
            "bid": bid,
            "freelancer": freelancer,
            "features": features
        })

    if not per_bid_data:
        return {"error": "No valid freelancers found for bids"}

    # --- Step 2: Normalize features across all bids ---
    prices = [b["features"]["price"] for b in per_bid_data]
    timelines = [b["features"]["timeline"] for b in per_bid_data]
    ratings = [b["features"]["rating"] for b in per_bid_data]
    completion = [b["features"]["completion_rate"] for b in per_bid_data]
    on_time = [b["features"]["on_time_rate"] for b in per_bid_data]
    skills = [b["features"]["skill_match"] for b in per_bid_data]
    portfolios = [b["features"]["portfolio_score"] for b in per_bid_data]

    # Normalize (note: price and timeline are inverted)
    norm_price = normalize_feature_list(prices, invert=True)
    norm_timeline = normalize_feature_list(timelines, invert=True)
    norm_rating = normalize_feature_list(ratings)
    norm_completion = normalize_feature_list(completion)
    norm_on_time = normalize_feature_list(on_time)
    norm_skills = normalize_feature_list(skills)
    norm_portfolio = normalize_feature_list(portfolios)

    # --- Step 3: Choose weights based on priority ---
    weights = adjust_weights_for_priority(priority)

    # --- Step 4: Calculate final score ---
    results = []
    for i, b_data in enumerate(per_bid_data):
        nf = {
            "price": norm_price[i],
            "rating": norm_rating[i],
            "completion_rate": norm_completion[i],
            "on_time_rate": norm_on_time[i],
            "skill_match": norm_skills[i],
            "portfolio_score": norm_portfolio[i],
            "timeline": norm_timeline[i]
        }
        
        # Calculate final score using the dynamic weights
        score = sum(weights[k] * nf[k] for k in weights)
        
        results.append({
            "bid_id": b_data["bid"].id,
            "freelancer_id": b_data["freelancer"].id,
            "freelancer_name": b_data["freelancer"].username,
            "bid_amount": b_data["bid"].amount,
            "timeline_days": b_data["bid"].proposed_timeline_days,
            
            "proposal": b_data["bid"].proposal, 
            # --- [END OF ADDITION] ---

            "score": round(score, 4),
            "debug_features": b_data["features"],
            "debug_normalized": nf
        })

    # --- Step 5: Sort by descending score ---
    results.sort(key=lambda x: x["score"], reverse=True)

    
    
    return {
        "weights_applied": weights,
        "ranked_bids": results
    }