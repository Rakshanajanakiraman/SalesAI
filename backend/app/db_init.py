import sys
import os

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.database import engine, Base, SessionLocal
from app.models import (
    Workspace, User, Role, Dataset, Product, ProductCategory,
    Supplier, Inventory, InventoryLog, InventoryAlert, Customer,
    Sale, SaleItem, Invoice, Payment, CustomerSegment, SalesForecast,
    ChurnPrediction, ProductRecommendation, Anomaly, Promotion, Feedback
)

def init_db():
    print("Creating all database tables in PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

    db = SessionLocal()
    try:
        # Seed default roles
        default_roles = [
            ("business_owner", "Business Owner", "Executive oversight, analytics, reports and business performance"),
            ("store_manager", "Store Manager", "Operational inventory control, sales tracking and stock alerts"),
            ("sales_executive", "Sales Executive", "Point of sale processing, invoices and customer servicing"),
            ("system_admin", "System Administrator", "User management, system configuration and dataset controls")
        ]

        for role_name, display_name, desc in default_roles:
            existing = db.query(Role).filter(Role.name == role_name).first()
            if not existing:
                role = Role(name=role_name, display_name=display_name, description=desc)
                db.add(role)
        db.commit()
        print("Default roles seeded successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
