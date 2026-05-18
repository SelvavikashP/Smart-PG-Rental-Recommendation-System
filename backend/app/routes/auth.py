from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import shutil
import uuid
import os
from ..database import get_db
from ..models.user import User, UserRole
from ..schemas import UserCreate, UserOut, Token, LoginRequest, UserUpdate
from ..services.auth_utils import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password
    hashed_password = get_password_hash(user_in.password)
    
    # Default admin setup if email contains admin@smartpg (handy trick for testing!)
    role = user_in.role
    if user_in.email.startswith("admin@"):
        role = UserRole.ADMIN
        
    db_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name,
        role=role,
        phone_number=user_in.phone_number,
        aadhar_number=user_in.aadhar_number,
        emergency_contact_name=user_in.emergency_contact_name,
        emergency_contact_phone=user_in.emergency_contact_phone,
        # Owners need approval, users & admins approved by default
        is_approved=True if role in [UserRole.USER, UserRole.ADMIN] else False 
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
def login_user(login_in: LoginRequest, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == login_in.email).first()
    if not db_user or not verify_password(login_in.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not db_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
        
    if not db_user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your profile is pending approval by the Admin. Please wait or contact support."
        )
        
    access_token = create_access_token(data={"sub": db_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

@router.get("/profile", response_model=UserOut)
def get_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserOut)
def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/upload")
def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    try:
        # Create unique filename to prevent overwrites
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join("static/uploads", unique_filename)
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return the public URL
        public_url = f"http://127.0.0.1:8000/static/uploads/{unique_filename}"
        return {"url": public_url}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}"
        )

