from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.database import get_db
from app.models.user import User
from app.models.customer import Customer
from app.models.sale import Sale
from app.models.dataset import Dataset
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("/")
def list_customers(
    q: Optional[str] = None,
    city: Optional[str] = None,
    customer_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Customer).filter(Customer.workspace_id == current_user.workspace_id)

    if q:
        query = query.filter(or_(
            Customer.full_name.ilike(f"%{q}%"),
            Customer.email.ilike(f"%{q}%"),
            Customer.phone.ilike(f"%{q}%"),
            Customer.customer_code.ilike(f"%{q}%")
        ))
    if city:
        query = query.filter(Customer.city == city)
    if customer_type:
        query = query.filter(Customer.customer_type == customer_type)

    total = query.count()
    customers = query.order_by(Customer.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "customers": customers
    }

@router.get("/suggestions")
def get_customer_suggestions(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Intelligent autocomplete suggestions for Indian customer names (Prompt Section 20).
    """
    suggestions = db.query(Customer.id, Customer.full_name, Customer.phone, Customer.email, Customer.city)\
        .filter(Customer.workspace_id == current_user.workspace_id, Customer.full_name.ilike(f"{q}%"))\
        .limit(10).all()

    return [{
        "id": c.id,
        "name": c.full_name,
        "phone": c.phone,
        "email": c.email,
        "city": c.city
    } for c in suggestions]

@router.get("/{customer_id}")
def get_customer_details(
    customer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.workspace_id == current_user.workspace_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    # Relational sales history
    sales = db.query(Sale).filter(Sale.customer_id == customer_id).order_by(Sale.sale_date.desc()).all()
    total_spent = sum([float(s.total_amount) for s in sales])
    order_count = len(sales)
    aov = (total_spent / order_count) if order_count > 0 else 0.0

    return {
        "customer": customer,
        "metrics": {
            "total_spent": round(total_spent, 2),
            "order_count": order_count,
            "average_order_value": round(aov, 2),
            "last_purchase_date": sales[0].sale_date if sales else None
        },
        "sales_history": [{
            "id": s.id,
            "sale_number": s.sale_number,
            "total_amount": float(s.total_amount),
            "payment_method": s.payment_method,
            "sale_date": s.sale_date,
            "items_count": len(s.items)
        } for s in sales[:15]]
    }

@router.post("/")
def create_customer(
    data: dict,
    current_user: User = Depends(require_roles(["business_owner", "store_manager", "sales_executive", "system_admin"])),
    db: Session = Depends(get_db)
):
    ws_id = current_user.workspace_id
    code = f"CUST-IND-{db.query(Customer).filter(Customer.workspace_id == ws_id).count() + 1001}"

    customer = Customer(
        workspace_id=ws_id,
        customer_code=code,
        full_name=data.get("full_name"),
        email=data.get("email"),
        phone=data.get("phone"),
        alternate_phone=data.get("alternate_phone"),
        gender=data.get("gender"),
        dob=data.get("dob") if data.get("dob") else None,
        address=data.get("address"),
        city=data.get("city", "Bengaluru"),
        state=data.get("state", "Karnataka"),
        pincode=data.get("pincode", "560001"),
        customer_type=data.get("customer_type", "Retail"),
        preferred_contact_method=data.get("preferred_contact_method", "WhatsApp"),
        status="Active",
        registration_date=date.today()
    )
    db.add(customer)
    db.flush()

    # Automatically add to / sync with active dataset
    active_ds = db.query(Dataset).filter(Dataset.workspace_id == ws_id, Dataset.is_active == True).first()
    if not active_ds:
        active_ds = db.query(Dataset).filter(Dataset.workspace_id == ws_id).order_by(Dataset.created_at.desc()).first()
        if not active_ds:
            active_ds = Dataset(
                workspace_id=ws_id,
                name="MarketMind AI Live Retail Dataset",
                source_type="live_db",
                row_count=0,
                is_active=True,
                description="Active workspace master dataset"
            )
            db.add(active_ds)
            db.flush()
        else:
            active_ds.is_active = True

    active_ds.row_count = (active_ds.row_count or 0) + 1
    db.commit()
    db.refresh(customer)

    return {
        "status": "success",
        "message": f"Customer '{customer.full_name}' saved to database and registered into dataset '{active_ds.name}'!",
        "id": customer.id,
        "customer_code": customer.customer_code,
        "full_name": customer.full_name,
        "phone": customer.phone,
        "email": customer.email,
        "city": customer.city,
        "state": customer.state,
        "pincode": customer.pincode,
        "customer_type": customer.customer_type,
        "dataset": {
            "id": active_ds.id,
            "name": active_ds.name,
            "row_count": active_ds.row_count
        }
    }
