from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), unique=True, nullable=False)
    current_stock = Column(Integer, default=0, nullable=False)
    reorder_level = Column(Integer, default=15, nullable=False)
    warehouse_location = Column(String(100), default="Warehouse A-1")
    last_restocked_at = Column(DateTime, default=get_utc_now)

    product = relationship("Product", back_populates="inventory")

class InventoryLog(Base):
    __tablename__ = "inventory_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    change_type = Column(String(50), nullable=False) # 'sale', 'restock', 'adjustment'
    quantity_change = Column(Integer, nullable=False) # e.g. -2 for sale, +50 for restock
    remaining_stock = Column(Integer, nullable=False)
    reference_id = Column(String(100), nullable=True) # Sale number or PO number
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    product = relationship("Product")

class InventoryAlert(Base):
    __tablename__ = "inventory_alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    alert_type = Column(String(50), default="low_stock")
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=get_utc_now)

    product = relationship("Product")
