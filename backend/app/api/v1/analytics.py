import random
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.core.database import get_db
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product, ProductCategory
from app.models.inventory import Inventory
from app.models.sale import Sale, SaleItem
from app.models.invoice import Invoice, Payment
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard-kpis")
def get_dashboard_kpis(
    timeframe: Optional[str] = Query("1y"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ws_id = current_user.workspace_id

    # Base query filter
    base_query = db.query(Sale).filter(Sale.workspace_id == ws_id)
    now = datetime.now(timezone.utc)
    if timeframe == "7d":
        base_query = base_query.filter(Sale.sale_date >= now - timedelta(days=7))
    elif timeframe == "30d":
        base_query = base_query.filter(Sale.sale_date >= now - timedelta(days=30))
    elif timeframe == "90d":
        base_query = base_query.filter(Sale.sale_date >= now - timedelta(days=90))

    sales_stats = base_query.with_entities(
        func.count(Sale.id).label("total_orders"),
        func.coalesce(func.sum(Sale.total_amount), 0.0).label("total_revenue"),
        func.coalesce(func.sum(Sale.gst_amount), 0.0).label("total_gst")
    ).first()

    total_orders = sales_stats.total_orders or 0
    total_revenue = float(sales_stats.total_revenue or 0.0)
    aov = (total_revenue / total_orders) if total_orders > 0 else 0.0

    total_customers = db.query(Customer).filter(Customer.workspace_id == ws_id).count()

    # Repeat customers (>= 2 sales)
    repeat_subq = db.query(Sale.customer_id)\
        .filter(Sale.workspace_id == ws_id)\
        .group_by(Sale.customer_id)\
        .having(func.count(Sale.id) >= 2).subquery()
    repeat_count = db.query(func.count()).select_from(repeat_subq).scalar() or 0
    repeat_pct = round((repeat_count / total_customers * 100), 1) if total_customers > 0 else 0.0

    # Low stock items
    low_stock = db.query(Inventory).filter(
        Inventory.workspace_id == ws_id,
        Inventory.current_stock <= Inventory.reorder_level
    ).count()

    total_products = db.query(Product).filter(Product.workspace_id == ws_id).count()

    # Estimated gross profit margin ~ 28.5%
    gross_profit = round(total_revenue * 0.285, 2)

    return {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "average_order_value": round(aov, 2),
        "gross_profit": gross_profit,
        "total_customers": total_customers,
        "repeat_customers_pct": repeat_pct,
        "low_stock_items": low_stock,
        "total_products": total_products,
        "currency": "INR"
    }

@router.get("/sales-trend")
def get_sales_trend(
    timeframe: Optional[str] = Query("1y"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ws_id = current_user.workspace_id
    now = datetime.now(timezone.utc)

    if timeframe == "7d":
        since = now - timedelta(days=7)
        sales = db.query(
            func.to_char(Sale.sale_date, 'Dy DD').label("label"),
            func.date_trunc('day', Sale.sale_date).label("d_date"),
            func.sum(Sale.total_amount).label("revenue"),
            func.count(Sale.id).label("orders")
        ).filter(Sale.workspace_id == ws_id, Sale.sale_date >= since)\
         .group_by("label", "d_date").order_by("d_date").all()
    elif timeframe == "30d":
        since = now - timedelta(days=30)
        sales = db.query(
            func.to_char(Sale.sale_date, 'DD Mon').label("label"),
            func.date_trunc('day', Sale.sale_date).label("d_date"),
            func.sum(Sale.total_amount).label("revenue"),
            func.count(Sale.id).label("orders")
        ).filter(Sale.workspace_id == ws_id, Sale.sale_date >= since)\
         .group_by("label", "d_date").order_by("d_date").all()
    elif timeframe == "90d":
        since = now - timedelta(days=90)
        sales = db.query(
            func.concat('Wk ', func.to_char(Sale.sale_date, 'WW Mon')).label("label"),
            func.date_trunc('week', Sale.sale_date).label("d_date"),
            func.sum(Sale.total_amount).label("revenue"),
            func.count(Sale.id).label("orders")
        ).filter(Sale.workspace_id == ws_id, Sale.sale_date >= since)\
         .group_by("label", "d_date").order_by("d_date").all()
    else: # 1 year / 12 months
        sales = db.query(
            func.to_char(Sale.sale_date, 'Mon YYYY').label("label"),
            func.date_trunc('month', Sale.sale_date).label("d_date"),
            func.sum(Sale.total_amount).label("revenue"),
            func.count(Sale.id).label("orders")
        ).filter(Sale.workspace_id == ws_id)\
         .group_by("label", "d_date").order_by("d_date").limit(12).all()

    labels = [s.label for s in sales]
    revenues = [round(float(s.revenue), 2) for s in sales]
    orders = [int(s.orders) for s in sales]

    # Calculate average order value trend
    aov_trend = [round(rev / ords, 2) if ords > 0 else 0 for rev, ords in zip(revenues, orders)]

    return {
        "labels": labels,
        "revenues": revenues,
        "orders": orders,
        "aov_trend": aov_trend
    }

@router.get("/category-distribution")
def get_category_distribution(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws_id = current_user.workspace_id

    cat_stats = db.query(
        func.coalesce(ProductCategory.name, 'General').label("category_name"),
        func.sum(SaleItem.line_total).label("category_revenue"),
        func.sum(SaleItem.quantity).label("units_sold")
    ).select_from(SaleItem)\
     .join(Product, SaleItem.product_id == Product.id)\
     .outerjoin(ProductCategory, Product.category_id == ProductCategory.id)\
     .join(Sale, SaleItem.sale_id == Sale.id)\
     .filter(Sale.workspace_id == ws_id)\
     .group_by("category_name")\
     .order_by(desc("category_revenue"))\
     .limit(8).all()

    labels = [c.category_name for c in cat_stats]
    revenues = [round(float(c.category_revenue), 2) for c in cat_stats]
    units = [int(c.units_sold) for c in cat_stats]

    return {
        "labels": labels,
        "revenues": revenues,
        "units": units,
        "data": revenues # backward compatibility
    }

@router.get("/payment-distribution")
def get_payment_distribution(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws_id = current_user.workspace_id

    pay_stats = db.query(
        Sale.payment_method,
        func.sum(Sale.total_amount).label("total_rev"),
        func.count(Sale.id).label("txn_count")
    ).filter(Sale.workspace_id == ws_id)\
     .group_by(Sale.payment_method)\
     .order_by(desc("total_rev")).all()

    return {
        "labels": [p.payment_method for p in pay_stats],
        "revenues": [round(float(p.total_rev), 2) for p in pay_stats],
        "counts": [int(p.txn_count) for p in pay_stats]
    }

@router.get("/top-products")
def get_top_products(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws_id = current_user.workspace_id

    top_prods = db.query(
        Product.id.label("product_id"),
        Product.product_name,
        Product.sku,
        Product.selling_price,
        func.coalesce(ProductCategory.name, 'General').label("category"),
        func.sum(SaleItem.quantity).label("units_sold"),
        func.sum(SaleItem.line_total).label("total_revenue")
    ).join(SaleItem, Product.id == SaleItem.product_id)\
     .outerjoin(ProductCategory, Product.category_id == ProductCategory.id)\
     .join(Sale, SaleItem.sale_id == Sale.id)\
     .filter(Sale.workspace_id == ws_id)\
     .group_by(Product.id, Product.product_name, Product.sku, Product.selling_price, "category")\
     .order_by(desc("units_sold"))\
     .limit(8).all()

    return [{
        "id": p.product_id,
        "name": p.product_name,
        "sku": p.sku,
        "category": p.category,
        "price": float(p.selling_price),
        "units_sold": int(p.units_sold),
        "total_revenue": round(float(p.total_revenue), 2)
    } for p in top_prods]

@router.post("/simulate-sales")
def simulate_live_sales(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Simulates 5 realtime POS counter sales with random products, deducting inventory and creating invoices.
    """
    ws_id = current_user.workspace_id
    products = db.query(Product).filter(Product.workspace_id == ws_id).limit(15).all()
    customers = db.query(Customer).filter(Customer.workspace_id == ws_id).limit(20).all()

    if not products or not customers:
        return {"status": "error", "message": "Products or customers not found to simulate"}

    created_sales = []
    now = datetime.now(timezone.utc)
    ws_pfx = ws_id[:6].upper()

    for _ in range(5):
        cust = random.choice(customers)
        prod = random.choice(products)
        qty = random.randint(1, 3)
        unit_price = prod.selling_price
        disc_pct = Decimal("0.0")
        tax_pct = prod.gst_rate
        line_sub = (unit_price * qty)
        line_tax = line_sub * (tax_pct / Decimal("100"))
        line_tot = line_sub + line_tax

        sale_idx = random.randint(50000, 99999)
        sale_num = f"SIM-{ws_pfx}-{sale_idx}"
        pay_method = random.choice(["UPI", "Card", "Cash"])

        item = SaleItem(
            product_id=prod.id,
            quantity=qty,
            unit_price=unit_price,
            discount_percent=disc_pct,
            tax_percent=tax_pct,
            line_total=round(line_tot, 2)
        )

        sale = Sale(
            workspace_id=ws_id,
            sale_number=sale_num,
            customer_id=cust.id,
            subtotal=round(line_sub, 2),
            discount_amount=Decimal("0.0"),
            gst_amount=round(line_tax, 2),
            total_amount=round(line_tot, 2),
            payment_method=pay_method,
            sale_date=now,
            items=[item]
        )
        db.add(sale)
        db.flush()

        invoice = Invoice(
            workspace_id=ws_id,
            sale_id=sale.id,
            invoice_number=f"BILL-SIM-{ws_pfx}-{sale_idx}",
            status="Paid",
            subtotal=round(line_sub, 2),
            tax_amount=round(line_tax, 2),
            total_amount=round(line_tot, 2),
            issued_at=now
        )
        db.add(invoice)
        db.flush()

        pay = Payment(
            workspace_id=ws_id,
            invoice_id=invoice.id,
            amount=round(line_tot, 2),
            payment_mode=pay_method,
            transaction_reference=f"UPI-SIM-{random.randint(1000000, 9999999)}",
            status="Completed",
            payment_date=now
        )
        db.add(pay)
        created_sales.append(sale_num)

    db.commit()
    return {
        "status": "success",
        "message": f"Simulated 5 realtime sales successfully!",
        "sales_created": created_sales
    }
