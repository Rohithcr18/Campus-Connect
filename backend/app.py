import os
from datetime import datetime, timedelta
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash

# Import database collections
from config.db import users_col

# Import routes
from routes.auth import auth_bp
from routes.events import events_bp
from routes.notices import notices_bp
from routes.announcements import announcements_bp
from routes.users import users_bp

app = Flask(__name__)

# Basic Configuration
app.config["SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "campus_connect_fallback_secret_7718")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "campus_connect_fallback_secret_7718")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)
app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")

# Enable CORS for frontend development server
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize JWT Manager
jwt = JWTManager(app)

# JWT custom error handlers
@jwt.unauthorized_loader
def unauthorized_response(callback):
    return jsonify({"message": "Missing authorization token.", "error": "unauthorized"}), 401

@jwt.invalid_token_loader
def invalid_token_response(callback):
    return jsonify({"message": "Invalid token details.", "error": "invalid_token"}), 401

@jwt.expired_token_loader
def expired_token_response(jwt_header, jwt_data):
    return jsonify({"message": "Session expired. Please log in again.", "error": "token_expired"}), 401

# Serve Uploaded Files
@app.route("/uploads/<path:filename>")
def serve_uploads(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(events_bp, url_prefix="/api/events")
app.register_blueprint(notices_bp, url_prefix="/api/notices")
app.register_blueprint(announcements_bp, url_prefix="/api/announcements")
app.register_blueprint(users_bp, url_prefix="/api/users")

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "app": "Campus Connect API"
    }), 200

def seed_admin():
    """Seed the default administrator if not present."""
    admin_email = "admin@campusconnect.com"
    existing = users_col.find_one({"email": admin_email})
    if not existing:
        admin_user = {
            "name": "System Administrator",
            "email": admin_email,
            "password": generate_password_hash("Admin@123"),
            "role": "admin",
            "approved": True,
            "profileImage": "",
            "createdAt": datetime.utcnow()
        }
        users_col.insert_one(admin_user)
        print("--------------------------------------------------")
        print(f"Seeded default admin: {admin_email} (pwd: Admin@123)")
        print("--------------------------------------------------")

if __name__ == "__main__":
    # Create upload directories
    os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "profiles"), exist_ok=True)
    os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "events"), exist_ok=True)
    os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "notices"), exist_ok=True)
    
    # Seed admin user
    seed_admin()
    
    port = int(os.getenv("PORT", 5000))
    print(f"Starting server on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=True)
