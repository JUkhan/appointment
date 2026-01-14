from models import Doctor
from flask_app import app
from db import db

# Initialize database and add sample data
def init_db():
    """Initialize database and add sample doctors"""
    with app.app_context():
        db.create_all()
        
        # Add sample doctors if they don't exist
        if Doctor.query.count() == 0:
            sample_doctors = [
                Doctor(name="Prof. Dr. Sharmin Rahman", skills ='M B B S (D A C), F C P S (OBS & Gynae)', availability="Mon-Fri 9AM-5PM"),
                Doctor(name="Dr. Rokeya Khatun", skills ='MBBS, MCPS (Gynae & Obs), DGO', availability="Tue-Thu 10AM-6PM"),
                Doctor(name="DR. MIR JAKIB HOSSAIN", skills ='MBBS, FCPS (MEDICINE), MD (GASTRO).', availability="Mon, Wed, Fri 8AM-4PM"),
                Doctor(name="DR. RASHIDUL HASAN SHAFIN", skills ='MBBS, BCS (HEALTH), FCPS (PEDIATRICS), FCPS PART-2 (NEWBORN)', availability="Mon-Sat 9AM-3PM")
            ]
            
            for doctor in sample_doctors:
                db.session.add(doctor)
            
            db.session.commit()
            print("✅ Sample doctors added to database")
        
        print("✅ Database initialized successfully")

