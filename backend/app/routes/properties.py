from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.property import Property
from ..models.user import User, UserRole
from ..models.review import Review
from ..schemas import PropertyCreate, PropertyUpdate, PropertyOut, ReviewCreate, ReviewOut
from ..services.auth_utils import get_current_user, get_current_owner

router = APIRouter(prefix="/api/properties", tags=["Properties"])

@router.get("", response_model=List[PropertyOut])
def get_properties(
    city: Optional[str] = None,
    property_type: Optional[str] = None,
    max_price: Optional[float] = None,
    wifi: Optional[bool] = None,
    parking: Optional[bool] = None,
    washing_machine: Optional[bool] = None,
    electricity: Optional[bool] = None,
    drinking_water: Optional[bool] = None,
    food_availability: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    # Only return approved and available properties to standard users
    query = db.query(Property).filter(
        Property.is_approved == True,
        Property.is_available == True
    )
    
    if city:
        query = query.filter(Property.city.ilike(f"%{city}%"))
    if property_type:
        query = query.filter(Property.property_type == property_type)
    if max_price is not None:
        query = query.filter(Property.price <= max_price)
        
    # Filters
    if wifi:
        query = query.filter(Property.wifi == True)
    if parking:
        query = query.filter(Property.parking == True)
    if washing_machine:
        query = query.filter(Property.washing_machine == True)
    if electricity:
        query = query.filter(Property.electricity == True)
    if drinking_water:
        query = query.filter(Property.drinking_water == True)
    if food_availability:
        query = query.filter(Property.food_availability == True)
        
    return query.all()

@router.get("/owner-properties", response_model=List[PropertyOut])
def get_owner_properties(
    current_owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db)
):
    if current_owner.role == UserRole.ADMIN:
        return db.query(Property).all()
    return db.query(Property).filter(Property.owner_id == current_owner.id).all()

@router.get("/{property_id}", response_model=PropertyOut)
def get_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop

@router.post("", response_model=PropertyOut, status_code=status.HTTP_201_CREATED)
def create_property(
    prop_in: PropertyCreate,
    current_owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db)
):
    db_prop = Property(
        owner_id=current_owner.id,
        **prop_in.model_dump(),
        is_approved=False  # Must be approved by Admin
    )
    db.add(db_prop)
    db.commit()
    db.refresh(db_prop)
    return db_prop

@router.put("/{property_id}", response_model=PropertyOut)
def update_property(
    property_id: int,
    prop_update: PropertyUpdate,
    current_owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db)
):
    db_prop = db.query(Property).filter(Property.id == property_id).first()
    if not db_prop:
        raise HTTPException(status_code=404, detail="Property not found")
        
    # Check permissions
    if db_prop.owner_id != current_owner.id and current_owner.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to edit this listing")
        
    update_data = prop_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_prop, key, value)
        
    # Re-verify listings if they edit major details
    if current_owner.role != UserRole.ADMIN:
        db_prop.is_approved = False
        
    db.commit()
    db.refresh(db_prop)
    return db_prop

@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: int,
    current_owner: User = Depends(get_current_owner),
    db: Session = Depends(get_db)
):
    db_prop = db.query(Property).filter(Property.id == property_id).first()
    if not db_prop:
        raise HTTPException(status_code=404, detail="Property not found")
        
    # Check permissions
    if db_prop.owner_id != current_owner.id and current_owner.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this listing")
        
    db.delete(db_prop)
    db.commit()
    return None


# --- REVIEWS & RATINGS ---
@router.post("/{property_id}/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def add_review(
    property_id: int,
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify property exists
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
        
    db_review = Review(
        property_id=property_id,
        user_id=current_user.id,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

@router.get("/{property_id}/reviews", response_model=List[ReviewOut])
def get_property_reviews(property_id: int, db: Session = Depends(get_db)):
    # Verify property exists
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
        
    return db.query(Review).filter(Review.property_id == property_id).all()
