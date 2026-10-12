from sqlalchemy import Column, String, DateTime
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    business_type = Column(String(100), default="Retail")
    city = Column(String(100), default="Bengaluru")
    state = Column(String(100), default="Karnataka")
    currency = Column(String(10), default="INR")
    created_at = Column(DateTime, default=get_utc_now)
