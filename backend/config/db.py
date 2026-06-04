import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is missing!")

# Establish MongoClient
client = MongoClient(MONGO_URI)

# Use database 'campus_connect'
db = client.get_database("campus_connect")

# Export collections
users_col = db.get_collection("users")
events_col = db.get_collection("events")
notices_col = db.get_collection("notices")
announcements_col = db.get_collection("announcements")
logs_col = db.get_collection("logs")

print("MongoDB connected successfully to database: campus_connect")
