from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.user import User
from app.models.invoice import Invoice
from app.models.sale import Sale
from app.api.deps import get_current_user

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.get("/")
def list_invoices(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ws_id = current_user.workspace_id
    query = db.query(Invoice).filter(Invoice.workspace_id == ws_id)
    total = query.count()
    invoices = query.order_by(desc(Invoice.issued_at)).offset(skip).limit(limit).all()

    return {
        "total": total,
        "invoices": [{
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "sale_number": inv.sale.sale_number if inv.sale else None,
            "customer_name": inv.sale.customer.full_name if inv.sale and inv.sale.customer else "Retail Customer",
            "customer_phone": inv.sale.customer.phone if inv.sale and inv.sale.customer else None,
            "subtotal": float(inv.subtotal),
            "tax_amount": float(inv.tax_amount),
            "total_amount": float(inv.total_amount),
            "status": inv.status,
            "issued_at": inv.issued_at
        } for inv in invoices]
    }

@router.get("/{invoice_id}")
def get_invoice_details(
    invoice_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.workspace_id == current_user.workspace_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found.")

    sale = inv.sale
    return {
        "id": inv.id,
        "invoice_number": inv.invoice_number,
        "issued_at": inv.issued_at,
        "status": inv.status,
        "subtotal": float(inv.subtotal),
        "tax_amount": float(inv.tax_amount),
        "total_amount": float(inv.total_amount),
        "customer": {
            "name": sale.customer.full_name if sale and sale.customer else "Walk-in Customer",
            "phone": sale.customer.phone if sale and sale.customer else None,
            "email": sale.customer.email if sale and sale.customer else None,
            "city": sale.customer.city if sale and sale.customer else None,
        } if sale else None,
        "items": [{
            "product_name": item.product.product_name if item.product else "Item",
            "sku": item.product.sku if item.product else "",
            "quantity": item.quantity,
            "unit_price": float(item.unit_price),
            "tax_percent": float(item.tax_percent),
            "line_total": float(item.line_total)
        } for item in (sale.items if sale else [])],
        "payments": [{
            "amount": float(p.amount),
            "payment_mode": p.payment_mode,
            "reference": p.transaction_reference,
            "date": p.payment_date
        } for p in inv.payments]
    }
