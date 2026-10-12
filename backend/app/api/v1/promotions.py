from datetime import date
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.user import User
from app.models.marketing import Promotion
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/promotions", tags=["Promotions"])

@router.get("/")
def list_promotions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ws_id = current_user.workspace_id
    promos = db.query(Promotion).filter(Promotion.workspace_id == ws_id).order_by(desc(Promotion.created_at)).all()
    return [{
        "id": p.id,
        "title": p.title,
        "description": p.description,
        "category": p.category,
        "discount_percent": float(p.discount_percent),
        "target_segment": p.target_segment,
        "start_date": str(p.start_date),
        "end_date": str(p.end_date),
        "status": p.status,
        "created_at": p.created_at
    } for p in promos]

@router.post("/")
def create_promotion(
    data: dict,
    current_user: User = Depends(require_roles(["business_owner", "store_manager", "system_admin"])),
    db: Session = Depends(get_db)
):
    title = data.get("title")
    if not title:
        raise HTTPException(status_code=400, detail="Promotion title is required.")

    start_date = data.get("start_date")
    end_date = data.get("end_date")
    if not start_date or not end_date:
        start_date = date.today()
        end_date = date.today()

    promo = Promotion(
        workspace_id=current_user.workspace_id,
        title=title,
        description=data.get("description", ""),
        category=data.get("category", "All Categories"),
        discount_percent=Decimal(str(data.get("discount_percent", 10.0))),
        target_segment=data.get("target_segment", "All Customers"),
        start_date=start_date,
        end_date=end_date,
        status=data.get("status", "Active")
    )
    db.add(promo)
    db.commit()
    db.refresh(promo)

    return {
        "id": promo.id,
        "title": promo.title,
        "description": promo.description,
        "category": promo.category,
        "discount_percent": float(promo.discount_percent),
        "target_segment": promo.target_segment,
        "start_date": str(promo.start_date),
        "end_date": str(promo.end_date),
        "status": promo.status
    }

@router.put("/{promo_id}/status")
def update_promotion_status(
    promo_id: str,
    data: dict,
    current_user: User = Depends(require_roles(["business_owner", "store_manager", "system_admin"])),
    db: Session = Depends(get_db)
):
    promo = db.query(Promotion).filter(
        Promotion.id == promo_id,
        Promotion.workspace_id == current_user.workspace_id
    ).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found.")

    new_status = data.get("status", "Active")
    promo.status = new_status
    db.commit()
    return {"status": "success", "new_status": new_status}

@router.delete("/{promo_id}")
def delete_promotion(
    promo_id: str,
    current_user: User = Depends(require_roles(["business_owner", "system_admin"])),
    db: Session = Depends(get_db)
):
    promo = db.query(Promotion).filter(
        Promotion.id == promo_id,
        Promotion.workspace_id == current_user.workspace_id
    ).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found.")

    db.delete(promo)
    db.commit()
    return {"status": "success"}
