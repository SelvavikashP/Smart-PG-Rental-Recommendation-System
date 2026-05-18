from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.user import User, UserRole
from ..models.property import Property
from ..models.review import Review
from ..schemas import UserOut, PropertyOut
from ..services.auth_utils import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["Admin Portal"])

@router.get("/users", response_model=List[UserOut])
def get_all_users(
    role: Optional[str] = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.all()

@router.put("/users/{user_id}/approve", response_model=UserOut)
def approve_user(
    user_id: int,
    approve: bool,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_approved = approve
    db.commit()
    db.refresh(user)
    return user

@router.get("/properties/pending", response_model=List[PropertyOut])
def get_pending_properties(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return db.query(Property).filter(Property.is_approved == False).all()

@router.put("/properties/{property_id}/approve", response_model=PropertyOut)
def approve_property(
    property_id: int,
    approve: bool,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
        
    prop.is_approved = approve
    db.commit()
    db.refresh(prop)
    return prop

@router.get("/analytics")
def get_analytics(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).filter(User.role == UserRole.USER).count()
    total_owners = db.query(User).filter(User.role == UserRole.OWNER).count()
    
    total_properties = db.query(Property).count()
    approved_properties = db.query(Property).filter(Property.is_approved == True).count()
    pending_properties = total_properties - approved_properties
    
    total_reviews = db.query(Review).count()
    
    # Get a simple breakdown by city
    city_counts = {}
    properties = db.query(Property).all()
    for p in properties:
        city_counts[p.city] = city_counts.get(p.city, 0) + 1
        
    return {
        "users_count": total_users,
        "owners_count": total_owners,
        "properties_count": total_properties,
        "approved_properties_count": approved_properties,
        "pending_properties_count": pending_properties,
        "reviews_count": total_reviews,
        "city_distribution": city_counts
    }
