from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    contact_person = Column(String(255))
    phone = Column(String(25))
    email = Column(String(255))
    city = Column(String(100), default="Mumbai")
    gstin = Column(String(50))
    created_at = Column(DateTime, default=get_utc_now)

class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255))

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    sku = Column(String(100), nullable=False, index=True)
    product_name = Column(String(255), nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("product_categories.id", ondelete="SET NULL"), nullable=True)
    subcategory = Column(String(100), nullable=True)
    brand = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    supplier_id = Column(String(36), ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    purchase_price = Column(Numeric(12, 2), nullable=False, default=0.0)
    selling_price = Column(Numeric(12, 2), nullable=False, default=0.0)
    discount_percent = Column(Numeric(5, 2), default=0.0)
    gst_rate = Column(Numeric(5, 2), default=18.0) # GST % (0, 5, 12, 18, 28)
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=get_utc_now)

    category = relationship("ProductCategory")
    supplier = relationship("Supplier")
    inventory = relationship("Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan")
