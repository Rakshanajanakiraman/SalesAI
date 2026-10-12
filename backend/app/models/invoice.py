from sqlalchemy import Column, String, Numeric, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    sale_id = Column(String(36), ForeignKey("sales.id", ondelete="CASCADE"), unique=True, nullable=False)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    status = Column(String(50), default="Paid") # Paid, Pending, Partially Paid
    due_date = Column(Date, nullable=True)
    subtotal = Column(Numeric(12, 2), nullable=False)
    tax_amount = Column(Numeric(12, 2), default=0.0)
    discount_amount = Column(Numeric(12, 2), default=0.0)
    total_amount = Column(Numeric(12, 2), nullable=False)
    issued_at = Column(DateTime, default=get_utc_now)

    sale = relationship("Sale", back_populates="invoice")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    invoice_id = Column(String(36), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    payment_mode = Column(String(50), default="UPI") # UPI, Cash, Card, Bank Transfer
    transaction_reference = Column(String(100), nullable=True)
    status = Column(String(50), default="Completed")
    payment_date = Column(DateTime, default=get_utc_now)

    invoice = relationship("Invoice", back_populates="payments")
