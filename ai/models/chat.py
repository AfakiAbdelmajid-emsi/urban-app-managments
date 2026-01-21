from pymongo import MongoClient
import os

def get_chat_collection():
    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        raise RuntimeError("MONGODB_URI not set")

    client = MongoClient(
        mongodb_uri,
        serverSelectionTimeoutMS=5000
    )

    db = client["test"]
    return db["chat_messages"]
