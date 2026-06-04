import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from flask_jwt_extended import get_jwt_identity
from bson import ObjectId
from config.db import events_col, logs_col, users_col
from middleware.auth import faculty_required, student_required, any_role_required

events_bp = Blueprint("events", __name__)

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS

def serialize_event(event):
    if not event:
        return None
    event["_id"] = str(event["_id"])
    return event

def log_activity(email, action, details):
    logs_col.insert_one({
        "email": email,
        "action": action,
        "details": details,
        "timestamp": datetime.utcnow()
    })

@events_bp.route("", methods=["GET"])
@any_role_required
def get_events():
    # Filter variables
    search_q = request.args.get("search")
    category = request.args.get("category")
    date_filter = request.args.get("dateFilter") # 'upcoming', 'past', 'all'
    
    query = {}
    
    if search_q:
        query["$or"] = [
            {"title": {"$regex": search_q, "$options": "i"}},
            {"description": {"$regex": search_q, "$options": "i"}},
            {"location": {"$regex": search_q, "$options": "i"}}
        ]
        
    if category and category != "All":
        query["category"] = category
        
    current_date = datetime.utcnow().strftime("%Y-%m-%d")
    if date_filter == "upcoming":
        query["date"] = {"$gte": current_date}
    elif date_filter == "past":
        query["date"] = {"$lt": current_date}

    # Pagination
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
    except ValueError:
        page = 1
        limit = 10

    total_events = events_col.count_documents(query)
    events_cursor = events_col.find(query).sort("date", 1).skip((page - 1) * limit).limit(limit)
    
    events_list = [serialize_event(e) for e in events_cursor]

    return jsonify({
        "events": events_list,
        "total": total_events,
        "page": page,
        "limit": limit,
        "pages": (total_events + limit - 1) // limit
    }), 200


@events_bp.route("/<id>", methods=["GET"])
@any_role_required
def get_event_by_id(id):
    try:
        event = events_col.find_one({"_id": ObjectId(id)})
    except Exception:
        return jsonify({"message": "Invalid event ID format."}), 400

    if not event:
        return jsonify({"message": "Event not found."}), 404

    return jsonify(serialize_event(event)), 200


@events_bp.route("", methods=["POST"])
@faculty_required
def create_event():
    email = get_jwt_identity()
    user = users_col.find_one({"email": email})
    
    data = request.form if request.form else request.json
    title = data.get("title")
    description = data.get("description")
    category = data.get("category")
    date = data.get("date")
    location = data.get("location")

    if not title or not description or not category or not date or not location:
        return jsonify({"message": "Please provide title, description, category, date, and location."}), 400

    image_url = ""
    if "image" in request.files:
        file = request.files["image"]
        if file and file.filename != "" and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            upload_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "events")
            os.makedirs(upload_dir, exist_ok=True)
            file.save(os.path.join(upload_dir, unique_filename))
            image_url = f"/uploads/events/{unique_filename}"

    new_event = {
        "title": title,
        "description": description,
        "category": category,
        "date": date,
        "location": location,
        "image": image_url,
        "createdBy": email,
        "createdByName": user.get("name", "Faculty Member"),
        "registrations": [],
        "createdAt": datetime.utcnow()
    }

    result = events_col.insert_one(new_event)
    log_activity(email, "CREATE_EVENT", f"Created new event: {title}")

    return jsonify({
        "message": "Event created successfully.",
        "event": serialize_event(new_event)
    }), 201


@events_bp.route("/<id>", methods=["PUT"])
@faculty_required
def update_event(id):
    email = get_jwt_identity()
    user = users_col.find_one({"email": email})

    try:
        event = events_col.find_one({"_id": ObjectId(id)})
    except Exception:
        return jsonify({"message": "Invalid event ID format."}), 400

    if not event:
        return jsonify({"message": "Event not found."}), 404

    # Authorization check: only event creator or admin can update
    if event["createdBy"] != email and user.get("role") != "admin":
        return jsonify({"message": "You are not authorized to update this event."}), 403

    data = request.form if request.form else request.json
    
    update_data = {}
    for key in ["title", "description", "category", "date", "location"]:
        if data.get(key) is not None:
            update_data[key] = data.get(key)

    # Process image upload
    if "image" in request.files:
        file = request.files["image"]
        if file and file.filename != "" and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            upload_dir = os.path.join(current_app.config["UPLOAD_FOLDER"], "events")
            os.makedirs(upload_dir, exist_ok=True)
            file.save(os.path.join(upload_dir, unique_filename))
            
            # Delete old image
            if event.get("image") and event["image"].startswith("/uploads/"):
                old_path = os.path.join(current_app.config["UPLOAD_FOLDER"], event["image"].replace("/uploads/", ""))
                if os.path.exists(old_path):
                    try:
                        os.remove(old_path)
                    except Exception:
                        pass
            
            update_data["image"] = f"/uploads/events/{unique_filename}"

    if not update_data:
        return jsonify({"message": "No updates provided."}), 400

    events_col.update_one({"_id": ObjectId(id)}, {"$set": update_data})
    log_activity(email, "UPDATE_EVENT", f"Updated event ID: {id} - {update_data.get('title', event['title'])}")

    updated_event = events_col.find_one({"_id": ObjectId(id)})
    return jsonify({
        "message": "Event updated successfully.",
        "event": serialize_event(updated_event)
    }), 200


@events_bp.route("/<id>", methods=["DELETE"])
@faculty_required
def delete_event(id):
    email = get_jwt_identity()
    user = users_col.find_one({"email": email})

    try:
        event = events_col.find_one({"_id": ObjectId(id)})
    except Exception:
        return jsonify({"message": "Invalid event ID format."}), 400

    if not event:
        return jsonify({"message": "Event not found."}), 404

    # Authorization check
    if event["createdBy"] != email and user.get("role") != "admin":
        return jsonify({"message": "You are not authorized to delete this event."}), 403

    # Delete event image
    if event.get("image") and event["image"].startswith("/uploads/"):
        old_path = os.path.join(current_app.config["UPLOAD_FOLDER"], event["image"].replace("/uploads/", ""))
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass

    events_col.delete_one({"_id": ObjectId(id)})
    log_activity(email, "DELETE_EVENT", f"Deleted event: {event['title']}")

    return jsonify({"message": "Event deleted successfully."}), 200


@events_bp.route("/register/<id>", methods=["POST"])
@student_required
def register_for_event(id):
    email = get_jwt_identity()
    
    try:
        event = events_col.find_one({"_id": ObjectId(id)})
    except Exception:
        return jsonify({"message": "Invalid event ID format."}), 400

    if not event:
        return jsonify({"message": "Event not found."}), 404

    registrations = event.get("registrations", [])
    
    if email in registrations:
        # Toggle off (unregister)
        events_col.update_one({"_id": ObjectId(id)}, {"$pull": {"registrations": email}})
        log_activity(email, "UNREGISTER_EVENT", f"Unregistered from event: {event['title']}")
        registered = False
        message = "Successfully unregistered from the event."
    else:
        # Toggle on (register)
        events_col.update_one({"_id": ObjectId(id)}, {"$push": {"registrations": email}})
        log_activity(email, "REGISTER_EVENT", f"Registered for event: {event['title']}")
        registered = True
        message = "Successfully registered for the event!"

    updated_event = events_col.find_one({"_id": ObjectId(id)})
    return jsonify({
        "message": message,
        "registered": registered,
        "registrations": updated_event.get("registrations", [])
    }), 200
