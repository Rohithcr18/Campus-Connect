import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId
from config.db import notices_col, logs_col, users_col
from middleware.auth import faculty_required, any_role_required

notices_bp = Blueprint("notices", __name__)

ALLOWED_DOC_EXTENSIONS = {"pdf", "doc", "docx", "png", "jpg", "jpeg"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_DOC_EXTENSIONS

def serialize_notice(notice):
    if not notice:
        return None
    notice["_id"] = str(notice["_id"])
    return notice

def log_activity(email, action, details):
    logs_col.insert_one({
        "email": email,
        "action": action,
        "details": details,
        "timestamp": datetime.utcnow()
    })

@notices_bp.route("", methods=["GET"])
@any_role_required
def get_notices():
    search_q = request.args.get("search")
    category = request.args.get("category")
    
    query = {}
    if search_q:
        query["$or"] = [
            {"title": {"$regex": search_q, "$options": "i"}},
            {"content": {"$regex": search_q, "$options": "i"}}
        ]
        
    if category and category != "All":
        query["category"] = category

    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
    except ValueError:
        page = 1
        limit = 10

    total_notices = notices_col.count_documents(query)
    notices_cursor = notices_col.find(query).sort("createdAt", -1).skip((page - 1) * limit).limit(limit)
    
    notices_list = [serialize_notice(n) for n in notices_cursor]

    return jsonify({
        "notices": notices_list,
        "total": total_notices,
        "page": page,
        "limit": limit,
        "pages": (total_notices + limit - 1) // limit
    }), 200


@notices_bp.route("/<id>", methods=["GET"])
@any_role_required
def get_notice_by_id(id):
    try:
        notice = notices_col.find_one({"_id": ObjectId(id)})
    except Exception:
        return jsonify({"message": "Invalid notice ID format."}), 400

    if not notice:
        return jsonify({"message": "Notice not found."}), 404

    return jsonify(serialize_notice(notice)), 200


@notices_bp.route("", methods=["POST"])
@faculty_required
def create_notice():
    email = get_jwt_identity()
    user = users_col.find_one({"email": email})
    
    data = request.form if request.form else request.json
    title = data.get("title")
    content = data.get("content")
    category = data.get("category")  # e.g., Academic, Placement, exam, general

    if not title or not content or not category:
        return jsonify({"message": "Please provide title, content, and category."}), 400

    attachment_url = ""
    if "attachment" in request.files:
        file = request.files["attachment"]
        if file and file.filename != "" and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            upload_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "notices")
            os.makedirs(upload_dir, exist_ok=True)
            file.save(os.path.join(upload_dir, unique_filename))
            attachment_url = f"/uploads/notices/{unique_filename}"

    new_notice = {
        "title": title,
        "content": content,
        "category": category,
        "attachment": attachment_url,
        "createdBy": email,
        "createdByName": user.get("name", "Faculty Member"),
        "createdAt": datetime.utcnow()
    }

    result = notices_col.insert_one(new_notice)
    log_activity(email, "CREATE_NOTICE", f"Posted notice: {title}")

    return jsonify({
        "message": "Notice posted successfully.",
        "notice": serialize_notice(new_notice)
    }), 201


@notices_bp.route("/<id>", methods=["PUT"])
@faculty_required
def update_notice(id):
    email = get_jwt_identity()
    user = users_col.find_one({"email": email})

    try:
        notice = notices_col.find_one({"_id": ObjectId(id)})
    except Exception:
        return jsonify({"message": "Invalid notice ID format."}), 400

    if not notice:
        return jsonify({"message": "Notice not found."}), 404

    # Auth check: creator or admin
    if notice["createdBy"] != email and user.get("role") != "admin":
        return jsonify({"message": "You are not authorized to update this notice."}), 403

    data = request.form if request.form else request.json
    
    update_data = {}
    for key in ["title", "content", "category"]:
        if data.get(key) is not None:
            update_data[key] = data.get(key)

    # Process attachment file
    if "attachment" in request.files:
        file = request.files["attachment"]
        if file and file.filename != "" and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            upload_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "notices")
            os.makedirs(upload_dir, exist_ok=True)
            file.save(os.path.join(upload_dir, unique_filename))
            
            # Delete old attachment
            if notice.get("attachment") and notice["attachment"].startswith("/uploads/"):
                old_path = os.path.join(current_app.config["UPLOAD_FOLDER"], notice["attachment"].replace("/uploads/", ""))
                if os.path.exists(old_path):
                    try:
                        os.remove(old_path)
                    except Exception:
                        pass
            
            update_data["attachment"] = f"/uploads/notices/{unique_filename}"

    if not update_data:
        return jsonify({"message": "No updates provided."}), 400

    notices_col.update_one({"_id": ObjectId(id)}, {"$set": update_data})
    log_activity(email, "UPDATE_NOTICE", f"Updated notice: {update_data.get('title', notice['title'])}")

    updated_notice = notices_col.find_one({"_id": ObjectId(id)})
    return jsonify({
        "message": "Notice updated successfully.",
        "notice": serialize_notice(updated_notice)
    }), 200


@notices_bp.route("/<id>", methods=["DELETE"])
@faculty_required
def delete_notice(id):
    email = get_jwt_identity()
    user = users_col.find_one({"email": email})

    try:
        notice = notices_col.find_one({"_id": ObjectId(id)})
    except Exception:
        return jsonify({"message": "Invalid notice ID format."}), 400

    if not notice:
        return jsonify({"message": "Notice not found."}), 404

    # Auth check: creator or admin
    if notice["createdBy"] != email and user.get("role") != "admin":
        return jsonify({"message": "You are not authorized to delete this notice."}), 403

    # Delete attachment
    if notice.get("attachment") and notice["attachment"].startswith("/uploads/"):
        old_path = os.path.join(current_app.config["UPLOAD_FOLDER"], notice["attachment"].replace("/uploads/", ""))
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass

    notices_col.delete_one({"_id": ObjectId(id)})
    log_activity(email, "DELETE_NOTICE", f"Deleted notice: {notice['title']}")

    return jsonify({"message": "Notice deleted successfully."}), 200
