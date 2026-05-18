from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    property_type = Column(String, default="PG", nullable=False)  # "PG" or "HOUSE"
    
    address = Column(String, nullable=False)
    city = Column(String, nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    price = Column(Float, nullable=False, index=True)
    is_available = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)  # Requires Admin Approval
    
    # Amenities (Flat structure for performance & simple querying)
    wifi = Column(Boolean, default=False)
    parking = Column(Boolean, default=False)
    washing_machine = Column(Boolean, default=False)
    electricity = Column(Boolean, default=False)  # e.g., 24/7 electricity backup
    drinking_water = Column(Boolean, default=False)
    food_availability = Column(Boolean, default=False)
    
    # Additional specs
    safety_score = Column(Float, default=7.0)  # Standard score out of 10
    images = Column(Text, default="[]")  # JSON string of image URLs
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="properties")
    reviews = relationship("Review", back_populates="property", cascade="all, delete-orphan")
