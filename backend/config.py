import os
from datetime import timedelta
from dotenv import load_dotenv
load_dotenv(override=True)
class Config:
    # Core
    SECRET_KEY          = os.getenv("SECRET_KEY", "atlas-dev-secret-change-in-prod")
    DEBUG               = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    # Database
    SQLALCHEMY_DATABASE_URI     = os.getenv("DATABASE_URL", "sqlite:///atlas.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT
    JWT_SECRET_KEY              = os.getenv("JWT_SECRET_KEY", "atlas-jwt-secret-change-in-prod")
    JWT_ACCESS_TOKEN_EXPIRES    = timedelta(hours=24)

    # Google OAuth
    GOOGLE_CLIENT_ID            = os.getenv("GOOGLE_CLIENT_ID", "")

    # CORS
    CORS_ORIGINS                = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

    # Upload
    UPLOAD_FOLDER               = os.path.join(os.path.dirname(__file__), "uploads")
    MAX_CONTENT_LENGTH          = 50 * 1024 * 1024   # 50 MB
    ALLOWED_EXTENSIONS          = {"csv", "xls", "xlsx"}

    # HuggingFace (optional, for NLP)
    HF_MODEL_NAME               = os.getenv("HF_MODEL_NAME", "distilbert-base-uncased")

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
