from sqlalchemy import Column, String, Integer, Numeric, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class Promotion(Base):
    __tablename__ = "promotions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    discount_percent = Column(Numeric(5, 2), nullable=False)
    target_segment = Column(String(100), default="All Customers")
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(50), default="Active") # Active, Expired, Draft
    created_at = Column(DateTime, default=get_utc_now)

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    rating = Column(Integer, nullable=False) # 1 - 5
    category = Column(String(100), default="General Feedback")
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)

    user = relationship("User")
