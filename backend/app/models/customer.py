from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    customer_code = Column(String(50), nullable=False)
    full_name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), index=True)
    phone = Column(String(25))
    alternate_phone = Column(String(25), nullable=True)
    gender = Column(String(20), nullable=True)
    dob = Column(Date, nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), default="Bengaluru", index=True)
    state = Column(String(100), default="Karnataka")
    pincode = Column(String(20), default="560001")
    customer_type = Column(String(50), default="Retail") # Retail, Wholesale, Corporate
    preferred_contact_method = Column(String(50), default="WhatsApp")
    status = Column(String(50), default="Active")
    registration_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)

    workspace = relationship("Workspace")
    sales = relationship("Sale", back_populates="customer", cascade="all, delete-orphan")
