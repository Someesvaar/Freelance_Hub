from app import ma
from app.models import User, Project, Bid, Review
from marshmallow import fields

# --- Minimal public user schema used inside other objects ---
class UserPublicSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        # expose only public fields
        fields = (
            "id", "username", "email", "is_freelancer", "bio", "skills",
            "avg_rating", "completion_rate", "on_time_rate", "portfolio_score"
        )

# --- Reusable nested schemas ---

class BidSchema(ma.SQLAlchemyAutoSchema):
    freelancer = fields.Nested(UserPublicSchema)

    class Meta:
        model = Bid
        include_fk = True
        load_instance = True
        # Expose fields explicitly to be explicit about the output shape
        fields = ("id", "amount", "proposal", "created_at", "proposed_timeline_days", "project_id", "freelancer", "freelancer_id")

class ReviewSchema(ma.SQLAlchemyAutoSchema):
    reviewer = fields.Nested(UserPublicSchema)
    reviewee = fields.Nested(UserPublicSchema)
    
    class Meta:
        model = Review
        include_fk = True
        load_instance = True
        fields = ("id", "rating", "comment", "created_at", "project_id", "reviewer", "reviewee", "reviewer_id", "reviewee_id")

class ProjectSchema(ma.SQLAlchemyAutoSchema):
    client = fields.Nested(UserPublicSchema)
    freelancer = fields.Nested(UserPublicSchema, allow_none=True)
    bids = fields.Nested(BidSchema, many=True)
    reviews = fields.Nested(ReviewSchema, many=True)

    class Meta:
        model = Project
        include_fk = True
        load_instance = True
        fields = (
            "id", "title", "description", "budget", "status", "created_at",
            "required_skills", "client", "freelancer", "bids", "reviews", "accepted_bid_id"
        )

class UserSchema(ma.SQLAlchemyAutoSchema):
    # Include reviews received (nested)
    reviews_received = fields.Nested(ReviewSchema, many=True)

    class Meta:
        model = User
        load_instance = True
        # Do not expose password_hash
        exclude = ("password_hash",)

    # Accept plaintext password on input (load-only)
    password = fields.String(load_only=True)
