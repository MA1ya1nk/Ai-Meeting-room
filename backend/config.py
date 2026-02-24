import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your_gemini_api_key_here")
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/meeting_tracker")
    FLASK_PORT = int(os.getenv("FLASK_PORT", 5000))