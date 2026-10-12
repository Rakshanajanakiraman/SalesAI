from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.inventory import Inventory, InventoryLog, InventoryAlert
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/")
def list_inventory(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws_id = current_user.workspace_id
    from sqlalchemy.orm import joinedload
    items = db.query(Inventory).filter(Inventory.workspace_id == ws_id).options(
        joinedload(Inventory.product).joinedload(Product.category)
    ).all()

    return [{
        "id": item.id,
        "product_id": item.product_id,
        "product_name": item.product.product_name,
        "sku": item.product.sku,
        "category": item.product.category.name if item.product.category else "General",
        "current_stock": item.current_stock,
        "reorder_level": item.reorder_level,
        "warehouse_location": item.warehouse_location,
        "is_low_stock": item.current_stock <= item.reorder_level,
        "last_restocked_at": item.last_restocked_at
    } for item in items]

@router.post("/adjust")
def adjust_stock(
    data: dict,
    current_user: User = Depends(require_roles(["business_owner", "store_manager", "system_admin"])),
    db: Session = Depends(get_db)
):
    """
    Adjusts inventory stock with full audit trail in inventory_logs (Prompt Section 25).
    """
    product_id = data.get("product_id")
    quantity_change = int(data.get("quantity_change", 0))
    reason = data.get("reason", "manual_adjustment")
    notes = data.get("notes", "")

    inv = db.query(Inventory).filter(Inventory.product_id == product_id, Inventory.workspace_id == current_user.workspace_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory item not found.")

    new_stock = max(0, inv.current_stock + quantity_change)
    inv.current_stock = new_stock
    inv.last_restocked_at = datetime.now(timezone.utc)

    # Audit log
    log = InventoryLog(
        workspace_id=current_user.workspace_id,
        product_id=product_id,
        change_type="restock" if quantity_change > 0 else "adjustment",
        quantity_change=quantity_change,
        remaining_stock=new_stock,
        reference_id=f"ADJ-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M')}",
        notes=f"{reason}: {notes}"
    )
    db.add(log)

    # Check alert threshold
    if new_stock <= inv.reorder_level:
        existing_alert = db.query(InventoryAlert).filter(
            InventoryAlert.product_id == product_id,
            InventoryAlert.is_read == False
        ).first()
        if not existing_alert:
            alert = InventoryAlert(
                workspace_id=current_user.workspace_id,
                product_id=product_id,
                alert_type="low_stock",
                message=f"Stock alert: Product stock is at {new_stock} (reorder level: {inv.reorder_level})."
            )
            db.add(alert)

    db.commit()
    return {"status": "success", "new_stock": new_stock}

@router.get("/alerts")
def get_inventory_alerts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alerts = db.query(InventoryAlert).filter(
        InventoryAlert.workspace_id == current_user.workspace_id
    ).order_by(InventoryAlert.created_at.desc()).limit(30).all()

    return [{
        "id": a.id,
        "product_id": a.product_id,
        "product_name": a.product.product_name if a.product else "Item",
        "alert_type": a.alert_type,
        "message": a.message,
        "is_read": a.is_read,
        "created_at": a.created_at
    } for a in alerts]

@router.get("/alerts/count")
def get_alerts_count(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(InventoryAlert).filter(
        InventoryAlert.workspace_id == current_user.workspace_id,
        InventoryAlert.is_read == False
    ).count()
    return {"unread_count": count}

@router.post("/alerts/{alert_id}/read")
def mark_alert_read(alert_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alert = db.query(InventoryAlert).filter(
        InventoryAlert.id == alert_id,
        InventoryAlert.workspace_id == current_user.workspace_id
    ).first()
    if alert:
        alert.is_read = True
        db.commit()
    return {"status": "success"}
