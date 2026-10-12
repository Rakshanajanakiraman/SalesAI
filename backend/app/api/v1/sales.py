from datetime import datetime, timezone, date
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.inventory import Inventory, InventoryLog, InventoryAlert
from app.models.sale import Sale, SaleItem
from app.models.invoice import Invoice, Payment
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.get("/")
def list_sales(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ws_id = current_user.workspace_id
    query = db.query(Sale).filter(Sale.workspace_id == ws_id)
    total = query.count()
    from sqlalchemy.orm import joinedload
    sales = query.options(
        joinedload(Sale.customer),
        joinedload(Sale.items),
        joinedload(Sale.invoice)
    ).order_by(desc(Sale.sale_date)).offset(skip).limit(limit).all()

    return {
        "total": total,
        "sales": [{
            "id": s.id,
            "sale_number": s.sale_number,
            "customer_name": s.customer.full_name if s.customer else "Walk-in Customer",
            "customer_id": s.customer_id,
            "total_amount": float(s.total_amount),
            "gst_amount": float(s.gst_amount),
            "payment_method": s.payment_method,
            "sale_date": s.sale_date,
            "items_count": len(s.items),
            "invoice_number": s.invoice.invoice_number if s.invoice else None
        } for s in sales]
    }

@router.post("/")
def create_sale(
    data: dict,
    current_user: User = Depends(require_roles(["business_owner", "store_manager", "sales_executive", "system_admin"])),
    db: Session = Depends(get_db)
):
    """
    Executes an atomic sales transaction:
    - Creates Sale and SaleItems
    - Reduces Product inventory & logs movement
    - Triggers low-stock alerts if threshold breached
    - Creates Invoice & Payment record
    """
    ws_id = current_user.workspace_id
    customer_id = data.get("customer_id")
    items_data = data.get("items", [])
    payment_method = data.get("payment_method", "UPI")

    if not customer_id:
        raise HTTPException(status_code=400, detail="Customer ID is required.")
    if not items_data:
        raise HTTPException(status_code=400, detail="At least one product item is required for a sale.")

    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.workspace_id == ws_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Selected customer does not exist.")

    import uuid
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    rand_code = uuid.uuid4().hex[:6].upper()
    sale_number = f"INV-{ws_id[:4].upper()}-{ts}-{rand_code}"
    invoice_number = f"BILL-{ws_id[:4].upper()}-{ts}-{rand_code}"

    subtotal = Decimal("0.0")
    gst_total = Decimal("0.0")
    sale_items = []
    stock_deductions = []

    for item in items_data:
        prod_id = item.get("product_id")
        qty = int(item.get("quantity", 1))

        product = db.query(Product).filter(Product.id == prod_id, Product.workspace_id == ws_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {prod_id} not found.")

        # Check Inventory stock
        inv = db.query(Inventory).filter(Inventory.product_id == prod_id, Inventory.workspace_id == ws_id).first()
        if not inv:
            inv = Inventory(
                workspace_id=ws_id,
                product_id=prod_id,
                current_stock=50,
                reorder_level=10,
                warehouse_location="Main Shelf"
            )
            db.add(inv)
            db.flush()
        elif inv.current_stock < qty:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient inventory for '{product.product_name}'. Only {inv.current_stock} available."
            )

        unit_price = product.selling_price
        disc_pct = Decimal(str(item.get("discount_percent", 0.0)))
        tax_pct = product.gst_rate

        line_sub = (unit_price * qty) * (Decimal("1") - (disc_pct / Decimal("100")))
        line_tax = line_sub * (tax_pct / Decimal("100"))
        line_total = line_sub + line_tax

        subtotal += line_sub
        gst_total += line_tax

        sale_item_obj = SaleItem(
            product_id=prod_id,
            quantity=qty,
            unit_price=unit_price,
            discount_percent=disc_pct,
            tax_percent=tax_pct,
            line_total=round(line_total, 2)
        )
        sale_items.append(sale_item_obj)
        stock_deductions.append((prod_id, qty, product.product_name))

    total_amount = round(subtotal + gst_total, 2)
    now = datetime.now(timezone.utc)

    # 1. Create Sale
    sale = Sale(
        workspace_id=ws_id,
        sale_number=sale_number,
        customer_id=customer_id,
        salesperson_id=current_user.id,
        subtotal=round(subtotal, 2),
        discount_amount=Decimal("0.0"),
        gst_amount=round(gst_total, 2),
        total_amount=total_amount,
        payment_method=payment_method,
        sale_date=now,
        items=sale_items
    )
    db.add(sale)
    db.flush()

    # 2. Reduce Inventory & Create Inventory Logs
    for prod_id, qty, p_name in stock_deductions:
        inv = db.query(Inventory).filter(Inventory.product_id == prod_id, Inventory.workspace_id == ws_id).first()
        if inv:
            inv.current_stock = max(0, inv.current_stock - qty)
            log = InventoryLog(
                workspace_id=ws_id,
                product_id=prod_id,
                change_type="sale",
                quantity_change=-qty,
                remaining_stock=inv.current_stock,
                reference_id=sale.sale_number,
                notes=f"Sold via POS: {qty} units of '{p_name}'"
            )
            db.add(log)

            # Trigger alert if stock <= reorder level
            if inv.current_stock <= inv.reorder_level:
                alert = InventoryAlert(
                    workspace_id=ws_id,
                    product_id=prod_id,
                    alert_type="low_stock",
                    message=f"Stock alert: '{p_name}' has fallen to {inv.current_stock} units (threshold: {inv.reorder_level})."
                )
                db.add(alert)

    # 3. Create Invoice
    invoice = Invoice(
        workspace_id=ws_id,
        sale_id=sale.id,
        invoice_number=invoice_number,
        status="Paid",
        due_date=date.today(),
        subtotal=round(subtotal, 2),
        tax_amount=round(gst_total, 2),
        discount_amount=Decimal("0.0"),
        total_amount=total_amount,
        issued_at=now
    )
    db.add(invoice)
    db.flush()

    # 4. Record Payment
    payment = Payment(
        workspace_id=ws_id,
        invoice_id=invoice.id,
        amount=total_amount,
        payment_mode=payment_method,
        transaction_reference=f"TXN-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        status="Completed",
        payment_date=now
    )
    db.add(payment)

    db.commit()

    return {
        "status": "success",
        "sale_id": sale.id,
        "sale_number": sale.sale_number,
        "invoice_number": invoice.invoice_number,
        "total_amount": float(total_amount),
        "message": "Sale transaction completed and committed to PostgreSQL!"
    }
