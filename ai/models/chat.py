from pymongo import MongoClient
from datetime import datetime
import os


MONGODB_URI=os.getenv("MONGODB_URI")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI not loaded")

client = MongoClient(MONGODB_URI)
db = client["test"]
chat_collection = db["chat_messages"]
