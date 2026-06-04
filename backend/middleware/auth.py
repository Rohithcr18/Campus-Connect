from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from config.db import users_col

def role_required(allowed_roles):
    """
    Decorator to restrict route access by role.
    Verifies that the user exists in the database and has the required role.
    If the user is a faculty member, verifies that they have been approved by the admin.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception as e:
                return jsonify({"message": "Authentication token is missing or invalid.", "error": str(e)}), 401
                
            email = get_jwt_identity()
            
            # Look up the user in database to ensure role/approval status is fresh
            user = users_col.find_one({"email": email})
            if not user:
                return jsonify({"message": "User account not found."}), 401
                
            user_role = user.get("role")
            if user_role not in allowed_roles:
                return jsonify({"message": "Access forbidden: insufficient permissions."}), 403
                
            if user_role == "faculty" and not user.get("approved", False):
                return jsonify({"message": "Access forbidden: faculty account requires admin approval."}), 403
                
            return fn(*args, **kwargs)
        return wrapper
    return decorator

def admin_required(fn):
    return role_required(["admin"])(fn)

def faculty_required(fn):
    return role_required(["faculty", "admin"])(fn)

def student_required(fn):
    return role_required(["student", "admin"])(fn)

def any_role_required(fn):
    return role_required(["student", "faculty", "admin"])(fn)
