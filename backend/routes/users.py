from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId
from config.db import users_col, logs_col, events_col, notices_col, announcements_col
from middleware.auth import admin_required, any_role_required

users_bp = Blueprint("users", __name__)

def serialize_user(user):
    if not user:
        return None
    user["_id"] = str(user["_id"])
    if "password" in user:
        del user["password"]
    return user

def log_activity(email, action, details):
    logs_col.insert_one({
        "email": email,
        "action": action,
        "details": details,
        "timestamp": datetime.utcnow()
    })

@users_bp.route("", methods=["GET"])
@admin_required
def get_all_users():
    search_q = request.args.get("search")
    role = request.args.get("role")
    
    query = {}
    if search_q:
        query["$or"] = [
            {"name": {"$regex": search_q, "$options": "i"}},
            {"email": {"$regex": search_q, "$options": "i"}}
        ]
        
    if role and role != "All":
        query["role"] = role

    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
    except ValueError:
        page = 1
        limit = 10

    total_users = users_col.count_documents(query)
    users_cursor = users_col.find(query).sort("createdAt", -1).skip((page - 1) * limit).limit(limit)
    users_list = [serialize_user(u) for u in users_cursor]

    return jsonify({
        "users": users_list,
        "total": total_users,
        "page": page,
        "limit": limit,
        "pages": (total_users + limit - 1) // limit
    }), 200


@users_bp.route("/<id>", methods=["PUT"])
@admin_required
def update_user_status(id):
    email = get_jwt_identity()
    try:
        user = users_col.find_one({"_id": ObjectId(id)})
    except Exception:
        return jsonify({"message": "Invalid user ID format."}), 400

    if not user:
        return jsonify({"message": "User not found."}), 404

    data = request.get_json()
    if not data:
        return jsonify({"message": "Invalid payload."}), 400

    update_data = {}
    # We can approve faculty, change role, change approval status
    if "approved" in data:
        update_data["approved"] = bool(data["approved"])
    if "role" in data and data["role"] in ["student", "faculty", "admin"]:
        update_data["role"] = data["role"]

    if not update_data:
        return jsonify({"message": "No updates provided."}), 400

    users_col.update_one({"_id": ObjectId(id)}, {"$set": update_data})
    
    # Log admin action
    action_type = "APPROVE_FACULTY" if "approved" in update_data and update_data["approved"] else "UPDATE_USER"
    log_activity(email, action_type, f"Admin updated user {user['email']}: {update_data}")

    updated_user = users_col.find_one({"_id": ObjectId(id)})
    return jsonify({
        "message": "User updated successfully.",
        "user": serialize_user(updated_user)
    }), 200


@users_bp.route("/<id>", methods=["DELETE"])
@admin_required
def delete_user(id):
    email = get_jwt_identity()
    try:
        user = users_col.find_one({"_id": ObjectId(id)})
    except Exception:
        return jsonify({"message": "Invalid user ID format."}), 400

    if not user:
        return jsonify({"message": "User not found."}), 404

    # Prevent deleting self
    if user["email"] == email:
        return jsonify({"message": "You cannot delete your own admin account."}), 400

    # Delete profile picture if exists locally
    if user.get("profileImage") and user["profileImage"].startswith("/uploads/"):
        old_path = os.path.join(current_app.config["UPLOAD_FOLDER"], user["profileImage"].replace("/uploads/", ""))
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass

    users_col.delete_one({"_id": ObjectId(id)})
    log_activity(email, "DELETE_USER", f"Admin deleted user account: {user['email']}")

    return jsonify({"message": "User account deleted successfully."}), 200


@users_bp.route("/logs", methods=["GET"])
@admin_required
def get_logs():
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 20))
    except ValueError:
        page = 1
        limit = 20

    total_logs = logs_col.count_documents({})
    logs_cursor = logs_col.find({}).sort("timestamp", -1).skip((page - 1) * limit).limit(limit)
    
    logs_list = []
    for log in logs_cursor:
        log["_id"] = str(log["_id"])
        logs_list.append(log)

    return jsonify({
        "logs": logs_list,
        "total": total_logs,
        "page": page,
        "limit": limit,
        "pages": (total_logs + limit - 1) // limit
    }), 200


@users_bp.route("/analytics", methods=["GET"])
@any_role_required
def get_analytics():
    total_students = users_col.count_documents({"role": "student"})
    total_faculty = users_col.count_documents({"role": "faculty"})
    pending_faculty = users_col.count_documents({"role": "faculty", "approved": False})
    total_events = events_col.count_documents({})
    total_notices = notices_col.count_documents({})
    total_announcements = announcements_col.count_documents({})
    
    events = list(events_col.find({}, {"registrations": 1}))
    total_registrations = sum(len(e.get("registrations", [])) for e in events)

    # Let's count categories of events for dynamic analytics chart on frontend
    categories_count = {}
    for event in events_col.find({}, {"category": 1}):
        cat = event.get("category", "Other")
        categories_count[cat] = categories_count.get(cat, 0) + 1

    return jsonify({
        "students": total_students,
        "faculty": total_faculty,
        "pendingFaculty": pending_faculty,
        "events": total_events,
        "notices": total_notices,
        "announcements": total_announcements,
        "registrations": total_registrations,
        "categoriesDistribution": categories_count
    }), 200
