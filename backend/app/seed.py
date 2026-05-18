from .database import SessionLocal, engine, Base
from .models.user import User, UserRole
from .models.property import Property
from .models.review import Review
from .services.auth_utils import get_password_hash
import json

def seed_db():
    print("Seeding database...")
    db = SessionLocal()
    
    # Failsafe: Prevent accidental overwrites of existing user/property data
    try:
        from .models.user import User
        from .models.property import Property
        
        user_count = db.query(User).count()
        property_count = db.query(Property).count()
        
        if user_count > 0 or property_count > 0:
            print("⚠️ Failsafe Activated: Database already contains existing users or properties.")
            print("Skipping seed process to protect your actual data from being overwritten.")
            db.close()
            return
    except Exception as e:
        # Tables might not exist yet, proceed with creation
        pass
    
    # 1. Clear existing database tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # 2. Create Users
    admin_pw = get_password_hash("admin123")
    owner_pw = get_password_hash("owner123")
    user_pw = get_password_hash("user123")
    
    admin = User(
        email="admin@smartpg.com",
        hashed_password=admin_pw,
        full_name="System Administrator",
        role=UserRole.ADMIN,
        phone_number="9876543210",
        is_approved=True
    )
    
    owner = User(
        email="owner@smartpg.com",
        hashed_password=owner_pw,
        full_name="Rajesh Warden",
        role=UserRole.OWNER,
        phone_number="9876543211",
        is_approved=True
    )
    
    renter = User(
        email="user@smartpg.com",
        hashed_password=user_pw,
        full_name="Aarav Sharma",
        role=UserRole.USER,
        phone_number="9876543212",
        aadhar_number="1234-5678-9012",
        aadhar_image_url="https://res.cloudinary.com/demo/image/upload/v1570975253/sample.jpg",
        photo_url="https://res.cloudinary.com/demo/image/upload/v1570975253/sample.jpg",
        emergency_contact_name="Sanjay Sharma",
        emergency_contact_phone="9876543213",
        is_approved=True
    )
    
    db.add_all([admin, owner, renter])
    db.commit()
    db.refresh(owner)
    db.refresh(renter)
    
    # 3. Create properties
    p1 = Property(
        owner_id=owner.id,
        title="Premium Boys PG Near Christ University",
        description="Luxurious fully-furnished rooms designed for students and working professionals. Features regular house-cleaning, security cameras, and proximity to shopping malls.",
        property_type="PG",
        address="Koramangala 3rd Block, Near Christ University Gate",
        city="Bangalore",
        latitude=12.9345,
        longitude=77.6101,
        price=8500.0,
        wifi=True,
        parking=True,
        washing_machine=True,
        electricity=True,
        drinking_water=True,
        food_availability=True,
        safety_score=9.2,
        images=json.dumps([
            "https://images.unsplash.com/photo-1555854817-cc0867f8e925?w=600&auto=format&fit=crop&q=60",
            "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&auto=format&fit=crop&q=60"
        ]),
        is_approved=True,
        is_available=True
    )
    
    p2 = Property(
        owner_id=owner.id,
        title="Modern 1BHK Co-Living Rental House",
        description="Beautiful cozy 1BHK rental flat perfect for couples or single professionals. Extremely quiet neighborhood, gated security, close to the metro station.",
        property_type="HOUSE",
        address="Indiranagar 100 Feet Road, Beside Metro Station",
        city="Bangalore",
        latitude=12.9716,
        longitude=77.6412,
        price=18000.0,
        wifi=True,
        parking=True,
        washing_machine=True,
        electricity=True,
        drinking_water=True,
        food_availability=False,
        safety_score=8.5,
        images=json.dumps([
            "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=60",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=60"
        ]),
        is_approved=True,
        is_available=True
    )
    
    p3 = Property(
        owner_id=owner.id,
        title="Budget Girls PG near South Campus",
        description="Affordable shared PG rooms for girls. Includes 3 home-cooked meals a day, mineral drinking water, 24/7 power backup, and walking distance to college campuses.",
        property_type="PG",
        address="Satya Niketan, Near Dhaula Kuan Metro",
        city="Delhi",
        latitude=28.5882,
        longitude=77.1685,
        price=6000.0,
        wifi=True,
        parking=False,
        washing_machine=True,
        electricity=True,
        drinking_water=True,
        food_availability=True,
        safety_score=9.5,
        images=json.dumps([
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&auto=format&fit=crop&q=60",
            "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&auto=format&fit=crop&q=60"
        ]),
        is_approved=True,
        is_available=True
    )

    p4 = Property(
        owner_id=owner.id,
        title="Luxury Co-living Penthouse in Gurgaon",
        description="Premium modern penthouse offering single private rooms. Rooftop swimming pool access, gourmet kitchen, indoor gym, and active community events.",
        property_type="HOUSE",
        address="DLF Phase 3, Near Cyber City metro",
        city="Delhi",
        latitude=28.4891,
        longitude=77.0898,
        price=25000.0,
        wifi=True,
        parking=True,
        washing_machine=True,
        electricity=True,
        drinking_water=True,
        food_availability=True,
        safety_score=9.0,
        images=json.dumps([
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&auto=format&fit=crop&q=60"
        ]),
        is_approved=True,
        is_available=True
    )

    db.add_all([p1, p2, p3, p4])
    db.commit()
    db.refresh(p1)
    db.refresh(p2)
    db.refresh(p3)

    # 4. Add some reviews
    r1 = Review(
        property_id=p1.id,
        user_id=renter.id,
        rating=5,
        comment="Absolutely fantastic place! The food is super clean and tastes like home, WiFi is blazing fast (great for my online classes), and Rajesh is incredibly friendly."
    )
    r2 = Review(
        property_id=p2.id,
        user_id=renter.id,
        rating=4,
        comment="A bit expensive, but the location is unmatched. Walking distance to Christ Univ and the Koramangala social hub. Gated parking is a big plus."
    )
    db.add_all([r1, r2])
    db.commit()
    
    db.close()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_db()
