import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Smart PG & Rental Accommodation API"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/smart_pg_db")
    
    # Security & Auth
    SECRET_KEY: str = os.getenv("SECRET_KEY", "SUPER_SECRET_KEY_CHANGE_THIS_IN_PRODUCTION")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 Days
    

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]

settings = Settings()
