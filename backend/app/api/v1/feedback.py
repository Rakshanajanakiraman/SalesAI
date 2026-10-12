from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.user import User
from app.models.marketing import Feedback
from app.api.deps import get_current_user

router = APIRouter(prefix="/feedback", tags=["Feedback"])

@router.get("/")
def list_feedback(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ws_id = current_user.workspace_id
    items = db.query(Feedback).filter(Feedback.workspace_id == ws_id).order_by(desc(Feedback.created_at)).all()
    return [{
        "id": f.id,
        "rating": f.rating,
        "category": f.category,
        "message": f.message,
        "user_name": f.user.full_name if f.user else "Anonymous",
        "created_at": f.created_at
    } for f in items]

@router.post("/")
def submit_feedback(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rating = int(data.get("rating", 5))
    message = data.get("message", "").strip()
    if not message:
        raise HTTPException(status_code=400, detail="Feedback message cannot be empty.")

    category = data.get("category", "Product Improvement")

    fb = Feedback(
        workspace_id=current_user.workspace_id,
        user_id=current_user.id,
        rating=max(1, min(5, rating)),
        category=category,
        message=message
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)

    return {
        "status": "success",
        "message": "Thank you for your valuable feedback! Our engineering team will review it.",
        "id": fb.id
    }
