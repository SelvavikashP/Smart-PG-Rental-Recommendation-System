from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .routes import auth, properties, admin
from .config import settings
import logging
import os

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn.error")

# Ensure static directories exist for uploads
UPLOAD_DIR = "static/uploads"
try:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    logger.info(f"Upload directory ready at: {UPLOAD_DIR}")
except Exception as e:
    logger.error(f"Error creating upload directory: {e}")

# Auto-create SQLite/Postgres tables on startup for hassle-free run
try:
    logger.info("Initializing database and tables...")
    # Import all models to ensure they are registered with Base metadata
    from . import models
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing database: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Scalable, Human-Verified PG and Rental Accommodation backend serving Students & Professionals.",
    version="1.0.0"
)

# Set up CORS middleware so Next.js frontend can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows any origin in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files directory so uploaded files are instantly accessible over HTTP
app.mount("/static", StaticFiles(directory="static"), name="static")

# Mount all the modular routers
app.include_router(auth.router)
app.include_router(properties.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the Smart PG & Rental Recommendation API. Direct-Owner database initialized.",
        "docs_url": "/docs"
    }
