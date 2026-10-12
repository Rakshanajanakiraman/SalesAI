from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class Sale(Base):
    __tablename__ = "sales"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    sale_number = Column(String(50), nullable=False, unique=True, index=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    salesperson_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    subtotal = Column(Numeric(12, 2), default=0.0)
    discount_amount = Column(Numeric(12, 2), default=0.0)
    gst_amount = Column(Numeric(12, 2), default=0.0)
    total_amount = Column(Numeric(12, 2), nullable=False)
    payment_method = Column(String(50), default="UPI") # UPI, Cash, Card, Bank Transfer
    sale_date = Column(DateTime, default=get_utc_now, index=True)

    workspace = relationship("Workspace")
    customer = relationship("Customer", back_populates="sales")
    salesperson = relationship("User")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
    invoice = relationship("Invoice", back_populates="sale", uselist=False, cascade="all, delete-orphan")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sale_id = Column(String(36), ForeignKey("sales.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False)
    discount_percent = Column(Numeric(5, 2), default=0.0)
    tax_percent = Column(Numeric(5, 2), default=18.0)
    line_total = Column(Numeric(12, 2), nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")
