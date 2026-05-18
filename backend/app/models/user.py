from sqlalchemy import Column, Integer, String, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
from ..database import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    OWNER = "OWNER"
    USER = "USER"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default=UserRole.USER, nullable=False)
    phone_number = Column(String, nullable=True)
    
    # Renter specific fields
    aadhar_number = Column(String, nullable=True)
    aadhar_image_url = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    
    # Active/Approval status
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=True)  # Admin can toggle this

    # Relationships
    properties = relationship("Property", back_populates="owner", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
