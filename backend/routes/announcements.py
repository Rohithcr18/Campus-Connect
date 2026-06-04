from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId
from config.db import announcements_col, logs_col, users_col
from middleware.auth import faculty_required, any_role_required

announcements_bp = Blueprint("announcements", __name__)

def serialize_announcement(ann):
    if not ann:
        return None
    ann["_id"] = str(ann["_id"])
    return ann

def log_activity(email, action, details):
    logs_col.insert_one({
        "email": email,
        "action": action,
        "details": details,
        "timestamp": datetime.utcnow()
    })

@announcements_bp.route("", methods=["GET"])
@any_role_required
def get_announcements():
    # Sort: Pinned (important: true) first, then by newest date
    ann_cursor = announcements_col.find({}).sort([("important", -1), ("createdAt", -1)])
    announcements_list = [serialize_announcement(a) for a in ann_cursor]
    return jsonify(announcements_list), 200


@announcements_bp.route("", methods=["POST"])
@faculty_required
def create_announcement():
    email = get_jwt_identity()
    user = users_col.find_one({"email": email})
    
    data = request.get_json()
    if not data:
        return jsonify({"message": "Invalid payload."}), 400

    title = data.get("title")
    message = data.get("message")
    important = data.get("important", False)

    if not title or not message:
        return jsonify({"message": "Please provide title and message."}), 400

    new_announcement = {
        "title": title,
        "message": message,
        "important": bool(important),
        "createdBy": email,
        "createdByName": user.get("name", "Faculty Member"),
        "createdAt": datetime.utcnow()
    }

    result = announcements_col.insert_one(new_announcement)
    log_activity(email, "CREATE_ANNOUNCEMENT", f"Created announcement: {title}")

    return jsonify({
        "message": "Announcement published successfully.",
        "announcement": serialize_announcement(new_announcement)
    }), 201


@announcements_bp.route("/<id>", methods=["PUT"])
@faculty_required
def update_announcement(id):
    email = get_jwt_identity()
    user = users_col.find_one({"email": email})

    try:
        ann = announcements_col.find_one({"_id": ObjectId(id)})
    except Exception:
        return jsonify({"message": "Invalid ID format."}), 400

    if not ann:
        return jsonify({"message": "Announcement not found."}), 404

    # Auth check: creator or admin
    if ann["createdBy"] != email and user.get("role") != "admin":
        return jsonify({"message": "You are not authorized to update this announcement."}), 403

    data = request.get_json()
    if not data:
        return jsonify({"message": "Invalid payload."}), 400

    update_data = {}
    if data.get("title") is not None:
        update_data["title"] = data.get("title")
    if data.get("message") is not None:
        update_data["message"] = data.get("message")
    if data.get("important") is not None:
        update_data["important"] = bool(data.get("important"))

    if not update_data:
        return jsonify({"message": "No updates provided."}), 400

    announcements_col.update_one({"_id": ObjectId(id)}, {"$set": update_data})
    log_activity(email, "UPDATE_ANNOUNCEMENT", f"Updated announcement ID: {id}")

    updated_ann = announcements_col.find_one({"_id": ObjectId(id)})
    return jsonify({
        "message": "Announcement updated successfully.",
        "announcement": serialize_announcement(updated_ann)
    }), 200


@announcements_bp.route("/<id>", methods=["DELETE"])
@faculty_required
def delete_announcement(id):
    email = get_jwt_identity()
    user = users_col.find_one({"email": email})

    try:
        ann = announcements_col.find_one({"_id": ObjectId(id)})
    except Exception:
        return jsonify({"message": "Invalid ID format."}), 400

    if not ann:
        return jsonify({"message": "Announcement not found."}), 404

    # Auth check
    if ann["createdBy"] != email and user.get("role") != "admin":
        return jsonify({"message": "You are not authorized to delete this announcement."}), 403

    announcements_col.delete_one({"_id": ObjectId(id)})
    log_activity(email, "DELETE_ANNOUNCEMENT", f"Deleted announcement: {ann['title']}")

    return jsonify({"message": "Announcement deleted successfully."}), 200
