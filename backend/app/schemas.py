from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from .models.user import UserRole

# --- USER SCHEMAS ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    role: UserRole = UserRole.USER

class UserCreate(UserBase):
    password: str
    # Renter specific fields (optional during signup, can update later)
    aadhar_number: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    aadhar_number: Optional[str] = None
    aadhar_image_url: Optional[str] = None
    photo_url: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

class UserOut(UserBase):
    id: int
    aadhar_image_url: Optional[str] = None
    photo_url: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    is_active: bool
    is_approved: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# --- PROPERTY SCHEMAS ---
class PropertyBase(BaseModel):
    title: str
    description: Optional[str] = None
    property_type: str = "PG"  # "PG" or "HOUSE"
    address: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price: float
    wifi: bool = False
    parking: bool = False
    washing_machine: bool = False
    electricity: bool = False
    drinking_water: bool = False
    food_availability: bool = False
    safety_score: float = 7.0
    images: Optional[str] = "[]"  # JSON list string

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price: Optional[float] = None
    is_available: Optional[bool] = None
    wifi: Optional[bool] = None
    parking: Optional[bool] = None
    washing_machine: Optional[bool] = None
    electricity: Optional[bool] = None
    drinking_water: Optional[bool] = None
    food_availability: Optional[bool] = None
    safety_score: Optional[float] = None
    images: Optional[str] = None

class PropertyOut(PropertyBase):
    id: int
    owner_id: int
    is_available: bool
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- REVIEW SCHEMAS ---
class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    property_id: int

class ReviewOut(ReviewBase):
    id: int
    property_id: int
    user_id: int
    created_at: datetime
    user: UserOut

    class Config:
        from_attributes = True


