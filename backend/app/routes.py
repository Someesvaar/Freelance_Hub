from flask import Blueprint, request, jsonify
from app import db
from app.models import User, Project, Bid, Review
from app.schemas import UserSchema, ProjectSchema, BidSchema, ReviewSchema
from werkzeug.security import generate_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from sqlalchemy import or_
from app.ranking_logic import calculate_ranked_bids
from app.external.freelancer import fetch_freelancer_rating
from app.models import ExternalProfile
from datetime import datetime, timedelta


# Initialize Schemas
user_schema = UserSchema()
users_schema = UserSchema(many=True)
project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)
bid_schema = BidSchema()
bids_schema = BidSchema(many=True)
review_schema = ReviewSchema()
reviews_schema = ReviewSchema(many=True)

# Create Blueprint
api_bp = Blueprint('api', __name__)

# --- Helper Functions ---
def get_user_from_jwt():
    """Helper to get the User object from the JWT token."""
    user_id = get_jwt_identity()
    return User.query.get(user_id)

def update_user_ranking(user_id):
    """Recalculates and updates a user's average rating score."""
    user = User.query.get(user_id)
    if not user:
        return

    reviews = user.reviews_received.all()
    if not reviews:
        # Use avg_rating from new model
        user.avg_rating = 0.0
    else:
        total_rating = sum(r.rating for r in reviews)
        # Use avg_rating from new model
        user.avg_rating = round(total_rating / len(reviews), 2)

    db.session.commit()

# --- Authentication Routes ---

@api_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()

    # Check if user already exists
    if User.query.filter_by(email=data['email']).first() or \
       User.query.filter_by(username=data['username']).first():
        return jsonify({"msg": "Email or username already exists"}), 400

    new_user = User(
        username=data['username'],
        email=data['email'],
        is_freelancer=data.get('is_freelancer', False)
    )
    new_user.set_password(data['password'])

    db.session.add(new_user)
    db.session.commit()

    return user_schema.dump(new_user), 201

@api_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()

    if user and user.check_password(data['password']):
        access_token = create_access_token(identity=str(user.id))
        return jsonify(access_token=access_token, user=user_schema.dump(user)), 200

    return jsonify({"msg": "Bad username or password"}), 401

# --- User Routes ---

@api_bp.route('/user/<int:id>', methods=['GET'])
def get_user_profile(id):
    user = User.query.get_or_404(id)

    # First, dump the main user data (bio, skills, etc.)
    user_data = user_schema.dump(user)

    # Now, manually query the dynamic relationships and serialize them
    if user.is_freelancer:
        # Get projects where this freelancer's bid was accepted
        accepted_projects = (
            Project.query
            .join(Bid, Project.accepted_bid_id == Bid.id)
            .filter(Bid.freelancer_id == user.id)
            .order_by(Project.created_at.desc())
            .all()
        )
        user_data['accepted_projects'] = projects_schema.dump(accepted_projects)
    else:
        # Get projects posted *by* this client
        posted_projects = user.projects_as_client.order_by(Project.created_at.desc()).all()
        user_data['posted_projects'] = projects_schema.dump(posted_projects)

    # Get reviews *received by* this user
    reviews_received = user.reviews_received.order_by(Review.created_at.desc()).all()
    user_data['reviews_received'] = reviews_schema.dump(reviews_received)

    return jsonify(user_data), 200

@api_bp.route('/user/profile', methods=['GET', 'PUT'])
@jwt_required()
def my_profile():
    user = get_user_from_jwt()

    if request.method == 'GET':
        user_data = user_schema.dump(user)

        if user.is_freelancer:
            # Get projects where this freelancer's bid was accepted
            accepted_projects = (
                Project.query
                .join(Bid, Project.accepted_bid_id == Bid.id)
                .filter(Bid.freelancer_id == user.id)
                .order_by(Project.created_at.desc())
                .all()
            )
            user_data['accepted_projects'] = projects_schema.dump(accepted_projects)
        else:
            posted_projects = user.projects_as_client.order_by(Project.created_at.desc()).all()
            user_data['posted_projects'] = projects_schema.dump(posted_projects)

        reviews_received = user.reviews_received.order_by(Review.created_at.desc()).all()
        user_data['reviews_received'] = reviews_schema.dump(reviews_received)

        return jsonify(user_data), 200

    if request.method == 'PUT':
        data = request.get_json()
        user.bio = data.get('bio', user.bio)
        user.skills = data.get('skills', user.skills)
        if 'password' in data:
            user.set_password(data['password'])

        db.session.commit()
        return user_schema.dump(user), 200
    
@api_bp.route("/user/import_freelancer_rating", methods=["POST"])
@jwt_required()
def import_freelancer_rating():
    user = get_user_from_jwt()
    data = request.get_json() or {}

    freelancer_name = data.get("username")
    if not freelancer_name:
        return jsonify({"error": "username is required"}), 400

    # Check cached profile (24h)
    existing = ExternalProfile.query.filter_by(
        user_id=user.id,
        provider="freelancer",
        external_username=freelancer_name
    ).first()

    if existing and existing.last_checked and \
       (datetime.utcnow() - existing.last_checked) < timedelta(hours=24):
        return jsonify({
            "ok": True,
            "cached": True,
            "rating": existing.rating,
            "reviews": existing.reviews
        }), 200

    # Fetch new data
    result = fetch_freelancer_rating(freelancer_name)
    if not result:
        return jsonify({"error": "Unable to fetch profile"}), 502

    # Upsert external profile
    if not existing:
        existing = ExternalProfile(
            user_id=user.id,
            provider="freelancer",
            external_username=freelancer_name
        )
        db.session.add(existing)

    existing.rating = result["rating"]
    existing.reviews = result["reviews"]
    existing.raw_data = result["raw"]
    existing.last_checked = datetime.utcnow()

    # Auto-update user's rating **ONLY** if Zero/None
    if result["rating"] and (not user.avg_rating or user.avg_rating == 0.0):
        user.avg_rating = float(result["rating"])

    db.session.commit()

    return jsonify({
        "ok": True,
        "cached": False,
        "rating": result["rating"],
        "reviews": result["reviews"]
    }), 200


# --- Project Routes ---

@api_bp.route('/projects', methods=['GET'])
def get_projects():
    try:
        # Logic to filter by skill query if provided
        skill_query = request.args.get('skill')

        query = Project.query.filter_by(status='open')

        if skill_query:
            # Simple 'like' search. 
            # Note: Your model.py has 'required_skills' which is what we should search
            query = query.filter(Project.required_skills.like(f"%{skill_query}%"))

        projects = query.order_by(Project.created_at.desc()).all()
        return projects_schema.dump(projects), 200

    except Exception as e:
        print(f"Error in /api/projects: {e}")
        return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500

@api_bp.route('/projects', methods=['POST'])
@jwt_required()
def create_project():
    user = get_user_from_jwt()
    data = request.get_json()

    new_project = Project(
        title=data['title'],
        description=data['description'],
        budget=data['budget'],
        client_id=user.id,
        # Add required_skills from new model
        required_skills=data.get('required_skills')
    )

    db.session.add(new_project)
    db.session.commit()
    return project_schema.dump(new_project), 201

@api_bp.route('/project/<int:id>', methods=['GET'])
def get_project(id):
    project = Project.query.get_or_404(id)
    return project_schema.dump(project), 200

@api_bp.route('/project/<int:id>', methods=['PUT'])
@jwt_required()
def update_project(id):
    project = Project.query.get_or_404(id)
    user = get_user_from_jwt()

    if project.client_id != user.id:
        return jsonify({"msg": "Not authorized"}), 403

    data = request.get_json()
    project.title = data.get('title', project.title)
    project.description = data.get('description', project.description)
    project.budget = data.get('budget', project.budget)
    project.status = data.get('status', project.status)
    # Add required_skills from new model
    project.required_skills = data.get('required_skills', project.required_skills)

    db.session.commit()
    return project_schema.dump(project), 200

# --- [DELETED THE OLD DUPLICATE 'accept_bid' FUNCTION THAT WAS HERE] ---

# --- Bid Routes ---

@api_bp.route('/project/<int:id>/bid', methods=['POST'])
@jwt_required()
def place_bid(id):
    user = get_user_from_jwt()
    project = Project.query.get_or_404(id)

    if not user.is_freelancer:
        return jsonify({"msg": "Only freelancers can bid"}), 403

    if project.status != 'open':
        return jsonify({"msg": "Project is not open for bidding"}), 400

    # Check if this freelancer has already bid
    existing_bid = Bid.query.filter_by(project_id=id, freelancer_id=user.id).first()
    if existing_bid:
        return jsonify({"msg": "You have already placed a bid on this project"}), 400

    data = request.get_json()
    new_bid = Bid(
        amount=data['amount'],
        proposal=data['proposal'],
        project_id=id,
        freelancer_id=user.id,
        # Add proposed_timeline_days from new model
        proposed_timeline_days=data.get('proposed_timeline_days')
    )

    db.session.add(new_bid)
    db.session.commit()
    return bid_schema.dump(new_bid), 201

# --- Review Routes ---

# --- [MODIFIED ROUTE] ---
@api_bp.route('/project/<int:id>/review', methods=['POST'])
@jwt_required()
def post_review(id):
    """
    Handles POSTING a review.
    Both Client and Freelancer use this route, but only AFTER
    the project status is 'completed'.
    """
    project = Project.query.get_or_404(id)
    user = get_user_from_jwt()
    data = request.get_json()

    reviewee_id = None
    
    # --- [CHANGED] Logic for: Client reviews Freelancer ---
    if user.id == project.client_id:
        # [KEY CHANGE] Client can ONLY review AFTER the project is 'completed'
        if project.status != 'completed':
            return jsonify({"msg": "You can only review this project after it is 'completed'"}), 400
        
        reviewee_id = project.freelancer_id
        
        # Check if client already reviewed
        existing_review = Review.query.filter_by(project_id=id, reviewer_id=user.id).first()
        if existing_review:
            return jsonify({"msg": "You have already reviewed this project"}), 400

        # Create the review
        new_review = Review(
            rating=data['rating'],
            comment=data.get('comment'),
            project_id=id,
            reviewer_id=user.id,
            reviewee_id=reviewee_id
        )
        db.session.add(new_review)
        
        # --- [REMOVED] ---
        # The line `project.status = 'completed'` is GONE.
        # Acceptance is handled by the new /accept route.
        
        db.session.commit() # Commit ONLY the review
        
        # Update freelancer's ranking
        update_user_ranking(reviewee_id)
        return review_schema.dump(new_review), 201

    # --- [UNCHANGED] Logic for: Freelancer reviews Client ---
    elif user.id == project.freelancer_id:
        # This logic was already correct.
        # Freelancer can ONLY review AFTER the client has completed the project
        if project.status != 'completed':
            return jsonify({"msg": "You can only review the client after the project is 'completed'"}), 400

        reviewee_id = project.client_id

        # Check if freelancer already reviewed
        existing_review = Review.query.filter_by(project_id=id, reviewer_id=user.id).first()
        if existing_review:
            return jsonify({"msg": "You have already reviewed this project"}), 400
        
        new_review = Review(
            rating=data['rating'],
            comment=data.get('comment'),
            project_id=id,
            reviewer_id=user.id,
            reviewee_id=reviewee_id
        )
        db.session.add(new_review)
        db.session.commit()
        
        # This function also works for clients if you want to track their rating
        # update_user_ranking(reviewee_id) 
        
        return review_schema.dump(new_review), 201

    # --- User is not part of the project ---
    else:
        return jsonify({"msg": "You are not part of this project"}), 403

@api_bp.route('/rank_bids', methods=['POST'])
def rank_bids():
    """
    Ranks bids using the modular logic.
    Example input JSON:
    {
        "project_id": 1,
        "priority": "price"  # or "time", "ratings", "balanced"
    }
    """
    data = request.get_json()
    project_id = data.get('project_id')
    priority = data.get('priority', 'balanced').lower()

    if not project_id:
        return jsonify({"error": "project_id is required"}), 400

    # --- Data Fetching ---
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    bids = Bid.query.filter_by(project_id=project_id).all()
    if not bids:
        return jsonify({"ranked_bids": [], "message": "No bids found for this project"}), 200

    # --- Call the Logic Function ---
    ranking_data = calculate_ranked_bids(project, bids, priority)

    if "error" in ranking_data:
        return jsonify(ranking_data), 404

    return jsonify({
        "project_title": project.title,
        "priority_used": priority,
        "weights_applied": ranking_data.get("weights_applied"),
        "ranked_bids": ranking_data.get("ranked_bids")
    }), 200

@api_bp.route('/user/my-accepted-projects', methods=['GET'])
@jwt_required()
def get_my_accepted_projects():
    current_user = get_user_from_jwt()

    if not current_user.is_freelancer:
        return jsonify(msg="Only freelancers can have accepted projects"), 403

    # This query will now work because `accept_bid` saves the `accepted_bid_id`
    projects = (
        Project.query
        .join(Bid, Project.accepted_bid_id == Bid.id)
        .filter(Bid.freelancer_id == current_user.id)
        .order_by(Project.created_at.desc())
        .all()
    )

    # Use the schema for serialization, just like in the profile routes
    return jsonify(projects=projects_schema.dump(projects)), 200


# --- [NEW ROUTE] ---
@api_bp.route('/project/<int:id>/complete', methods=['POST'])
@jwt_required()
def freelancer_complete_project(id):
    """
    Called by the FREELANCER.
    Moves the project from 'in_progress' or 'needs_revision' to 'pending_review'.
    """
    project = Project.query.get_or_404(id)
    user = get_user_from_jwt()

    # 1. Check if user is the freelancer on this project
    if project.freelancer_id != user.id:
        return jsonify({"msg": "Not authorized. Only the assigned freelancer can complete."}), 403

    # 2. Check if project is in a state to be completed
    if project.status not in ['in_progress', 'needs_revision']:
        return jsonify({"msg": f"Project cannot be marked complete from status '{project.status}'"}), 400

    # 3. Update status
    project.status = 'pending_review'
    db.session.commit()
    return project_schema.dump(project), 200


# --- [NEW ROUTE] ---
@api_bp.route('/project/<int:id>/request_revision', methods=['POST'])
@jwt_required()
def client_request_revision(id):
    """
    Called by the CLIENT.
    Moves the project from 'pending_review' back to 'needs_revision'.
    """
    project = Project.query.get_or_404(id)
    user = get_user_from_jwt()

    # 1. Check if user is the client for this project
    if project.client_id != user.id:
        return jsonify({"msg": "Not authorized. Only the client can request revisions."}), 403

    # 2. Check if project is pending their review
    if project.status != 'pending_review':
        return jsonify({"msg": "Project is not awaiting your review"}), 400

    # 3. Update status
    project.status = 'needs_revision'
    db.session.commit()
    return project_schema.dump(project), 200

# --- [DELETED THE OLD DUPLICATE 'client_accept_work' FUNCTION THAT WAS HERE] ---


# --- [UPDATED 'accept_bid' FUNCTION] ---
# This is the single, correct version
@api_bp.route('/project/<int:id>/accept_bid', methods=['POST'])
@jwt_required()
def accept_bid(id):
    project = Project.query.get_or_404(id)
    user = get_user_from_jwt()

    if project.client_id != user.id:
        return jsonify({"msg": "Not authorized"}), 403

    if project.status != 'open':
        return jsonify({"msg": "Project is not open for bidding"}), 400

    data = request.get_json()
    bid_id = data.get('bid_id')
    bid = Bid.query.get_or_404(bid_id)

    if bid.project_id != project.id:
        return jsonify({"msg": "Bid does not belong to this project"}), 400

    # --- [NEW LOGIC] ---
    # Get the freelancer from the bid and increment their counter
    freelancer = User.query.get(bid.freelancer_id)
    if freelancer:
        freelancer.projects_accepted += 1
    # --- [END NEW LOGIC] ---

    project.freelancer_id = bid.freelancer_id
    project.status = 'in_progress'
    project.accepted_bid_id = bid.id

    # This commit saves both the project changes AND the freelancer's updated count
    db.session.commit() 
    return project_schema.dump(project), 200


# --- [UPDATED 'client_accept_work' FUNCTION] ---
# This is the single, correct version
@api_bp.route('/project/<int:id>/accept', methods=['POST'])
@jwt_required()
def client_accept_work(id):
    """
    Called by the CLIENT.
    Moves the project from 'pending_review' to 'completed'.
    """
    project = Project.query.get_or_404(id)
    user = get_user_from_jwt()

    if project.client_id != user.id:
        return jsonify({"msg": "Not authorized. Only the client can accept."}), 403

    if project.status != 'pending_review':
        return jsonify({"msg": f"Project cannot be accepted from status '{project.status}'"}), 400

    # --- [NEW LOGIC] ---
    # Get the assigned freelancer from the project and increment their counter
    if project.freelancer_id:
        freelancer = User.query.get(project.freelancer_id)
        if freelancer:
            freelancer.projects_completed += 1
    # --- [END NEW LOGIC] ---

    project.status = 'completed'
    
    # This commit saves both the project status AND the freelancer's updated count
    db.session.commit()
    return project_schema.dump(project), 200