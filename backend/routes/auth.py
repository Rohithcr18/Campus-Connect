import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from config.db import users_col, logs_col
from middleware.auth import any_role_required

auth_bp = Blueprint("auth", __name__)

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

def allowed_file(filename, allowed_extensions):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions

def log_activity(email, action, details):
    """Utility to log user activity."""
    logs_col.insert_one({
        "email": email,
        "action": action,
        "details": details,
        "timestamp": datetime.utcnow()
    })

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.form if request.form else request.json
    if not data:
        return jsonify({"message": "Request body must contain form data or JSON."}), 400

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")  # student or faculty

    if not name or not email or not password or not role:
        return jsonify({"message": "Please provide name, email, password, and role."}), 400

    if role not in ["student", "faculty"]:
        return jsonify({"message": "Invalid role. Role must be 'student' or 'faculty'."}), 400

    # Normalise email
    email = email.strip().lower()

    # Check if user already exists
    if users_col.find_one({"email": email}):
        return jsonify({"message": "A user with this email already exists."}), 400

    # Auto-approve students, require approval for faculty
    approved = True if role == "student" else False

    # Handle optional profile image upload
    profile_image_url = ""
    if "profileImage" in request.files:
        file = request.files["profileImage"]
        if file and file.filename != "" and allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            upload_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "profiles")
            os.makedirs(upload_dir, exist_ok=True)
            file.save(os.path.join(upload_dir, unique_filename))
            profile_image_url = f"/uploads/profiles/{unique_filename}"

    hashed_password = generate_password_hash(password)

    new_user = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "role": role,
        "approved": approved,
        "profileImage": profile_image_url,
        "createdAt": datetime.utcnow()
    }

    users_col.insert_one(new_user)
    log_activity(email, "REGISTER", f"Registered new user account as {role}.")

    message = "Registration successful! You can now log in." if approved else "Registration successful! Faculty accounts require administrator approval before logging in."
    return jsonify({"message": message, "approved": approved}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Invalid request."}), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Please provide email and password."}), 400

    email = email.strip().lower()

    user = users_col.find_one({"email": email})
    if not user:
        return jsonify({"message": "Invalid email or password."}), 401

    if not check_password_hash(user["password"], password):
        return jsonify({"message": "Invalid email or password."}), 401

    # Faculty approval check
    if user["role"] == "faculty" and not user.get("approved", False):
        return jsonify({"message": "Your account has not been approved by the administrator yet."}), 403

    # Generate JWT token
    token = create_access_token(identity=email)
    log_activity(email, "LOGIN", "Logged into the system.")

    return jsonify({
        "token": token,
        "user": {
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "approved": user.get("approved", True),
            "profileImage": user.get("profileImage", "")
        }
    }), 200


@auth_bp.route("/profile", methods=["GET"])
@any_role_required
def get_profile():
    email = get_jwt_identity()
    user = users_col.find_one({"email": email})
    if not user:
        return jsonify({"message": "User not found."}), 404

    return jsonify({
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "approved": user.get("approved", True),
        "profileImage": user.get("profileImage", ""),
        "createdAt": user.get("createdAt")
    }), 200


@auth_bp.route("/profile", methods=["PUT"])
@any_role_required
def update_profile():
    email = get_jwt_identity()
    user = users_col.find_one({"email": email})
    if not user:
        return jsonify({"message": "User not found."}), 404

    data = request.form if request.form else request.json
    name = data.get("name")
    
    update_data = {}
    if name:
        update_data["name"] = name

    # Process image upload if any
    if "profileImage" in request.files:
        file = request.files["profileImage"]
        if file and file.filename != "" and allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            upload_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "profiles")
            os.makedirs(upload_dir, exist_ok=True)
            file.save(os.path.join(upload_dir, unique_filename))
            
            # Delete old image if exists locally
            if user.get("profileImage") and user["profileImage"].startswith("/uploads/"):
                old_path = os.path.join(current_app.config["UPLOAD_FOLDER"], user["profileImage"].replace("/uploads/", ""))
                if os.path.exists(old_path):
                    try:
                        os.remove(old_path)
                    except Exception:
                        pass
                        
            update_data["profileImage"] = f"/uploads/profiles/{unique_filename}"

    if not update_data:
        return jsonify({"message": "No profile updates provided."}), 400

    users_col.update_one({"email": email}, {"$set": update_data})
    log_activity(email, "UPDATE_PROFILE", "Updated user profile details.")

    # Fetch updated user
    updated_user = users_col.find_one({"email": email})
    return jsonify({
        "message": "Profile updated successfully.",
        "user": {
            "name": updated_user["name"],
            "email": updated_user["email"],
            "role": updated_user["role"],
            "approved": updated_user.get("approved", True),
            "profileImage": updated_user.get("profileImage", "")
        }
    }), 200


@auth_bp.route("/profile/change-password", methods=["PUT"])
@any_role_required
def change_password():
    email = get_jwt_identity()
    user = users_col.find_one({"email": email})
    if not user:
        return jsonify({"message": "User not found."}), 404

    data = request.get_json()
    current_password = data.get("currentPassword")
    new_password = data.get("newPassword")

    if not current_password or not new_password:
        return jsonify({"message": "Please provide current and new passwords."}), 400

    if not check_password_hash(user["password"], current_password):
        return jsonify({"message": "Incorrect current password."}), 400

    hashed_password = generate_password_hash(new_password)
    users_col.update_one({"email": email}, {"$set": {"password": hashed_password}})
    log_activity(email, "CHANGE_PASSWORD", "Changed password.")

    return jsonify({"message": "Password changed successfully."}), 200
