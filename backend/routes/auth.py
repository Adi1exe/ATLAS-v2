from flask import Blueprint, request, jsonify, current_app
from google.oauth2 import id_token
from google.auth.transport import requests as g_requests
from flask_jwt_extended import create_access_token
from extensions import db
from models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/google")
def google_login():
    """Verify Google ID token, upsert user, return JWT."""
    credential = request.json.get("credential")
    if not credential:
        return jsonify({"error": "Missing credential"}), 400

    client_id = current_app.config["GOOGLE_CLIENT_ID"]
    if not client_id:
        return jsonify({"error": "Google OAuth not configured on server"}), 500

    try:
        id_info = id_token.verify_oauth2_token(
            credential,
            g_requests.Request(),
            client_id,
            clock_skew_in_seconds=10,
        )
    except ValueError as e:
        return jsonify({"error": f"Invalid token: {e}"}), 401

    google_id = id_info["sub"]
    email     = id_info.get("email", "")
    name      = id_info.get("name", "")
    picture   = id_info.get("picture", "")

    user = User.query.filter_by(google_id=google_id).first()
    if not user:
        user = User(google_id=google_id, email=email, name=name, picture=picture)
        db.session.add(user)
    else:
        user.name    = name
        user.picture = picture
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 200


@auth_bp.get("/me")
def me():
    from flask_jwt_extended import jwt_required, get_jwt_identity
    # This is a helper endpoint; actual protection is handled per-route via decorator
    return jsonify({"message": "Use /api/auth/google to authenticate"}), 200
