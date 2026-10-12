from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.core.database import get_db
from app.models.user import User
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.api.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary")
def get_business_report_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ws_id = current_user.workspace_id

    # 1. Total revenue and GST
    sales_agg = db.query(
        func.count(Sale.id).label("total_sales_count"),
        func.coalesce(func.sum(Sale.total_amount), 0.0).label("gross_revenue"),
        func.coalesce(func.sum(Sale.gst_amount), 0.0).label("total_gst_collected"),
        func.coalesce(func.sum(Sale.discount_amount), 0.0).label("total_discounts")
    ).filter(Sale.workspace_id == ws_id).first()

    gross_revenue = float(sales_agg.gross_revenue or 0.0)
    total_gst = float(sales_agg.total_gst_collected or 0.0)
    total_discounts = float(sales_agg.total_discounts or 0.0)
    total_orders = sales_agg.total_sales_count or 0

    # 2. Inventory Valuation
    inv_data = db.query(
        func.coalesce(func.sum(Inventory.current_stock), 0).label("total_units_in_stock"),
        func.coalesce(func.sum(Inventory.current_stock * Product.purchase_price), 0.0).label("inventory_cost_value"),
        func.coalesce(func.sum(Inventory.current_stock * Product.selling_price), 0.0).label("inventory_retail_value")
    ).join(Product, Inventory.product_id == Product.id)\
     .filter(Inventory.workspace_id == ws_id).first()

    total_units_in_stock = int(inv_data.total_units_in_stock or 0)
    inv_cost_value = float(inv_data.inventory_cost_value or 0.0)
    inv_retail_value = float(inv_data.inventory_retail_value or 0.0)
    potential_margin = round(inv_retail_value - inv_cost_value, 2)

    # 3. Cost of Goods Sold (COGS) from SaleItems
    cogs_data = db.query(
        func.coalesce(func.sum(SaleItem.quantity * Product.purchase_price), 0.0).label("total_cogs")
    ).join(Product, SaleItem.product_id == Product.id)\
     .join(Sale, SaleItem.sale_id == Sale.id)\
     .filter(Sale.workspace_id == ws_id).scalar() or 0.0
    cogs = float(cogs_data)
    net_profit = round(gross_revenue - cogs, 2)
    profit_margin_pct = round((net_profit / gross_revenue * 100), 1) if gross_revenue > 0 else 0.0

    # 4. Payment breakdown
    payments = db.query(
        Sale.payment_method,
        func.count(Sale.id).label("count"),
        func.sum(Sale.total_amount).label("total")
    ).filter(Sale.workspace_id == ws_id)\
     .group_by(Sale.payment_method).all()

    payment_breakdown = [{
        "method": p.payment_method,
        "count": p.count,
        "amount": round(float(p.total), 2),
        "percentage": round(float(p.total) / gross_revenue * 100, 1) if gross_revenue > 0 else 0.0
    } for p in payments]

    # 5. Top performing categories
    from app.models.product import ProductCategory
    cat_sales = db.query(
        func.coalesce(ProductCategory.name, "General").label("category_name"),
        func.coalesce(func.sum(SaleItem.quantity), 0).label("units_sold"),
        func.coalesce(func.sum(SaleItem.line_total), 0.0).label("category_rev")
    ).select_from(SaleItem)\
     .join(Product, SaleItem.product_id == Product.id)\
     .outerjoin(ProductCategory, Product.category_id == ProductCategory.id)\
     .join(Sale, SaleItem.sale_id == Sale.id)\
     .filter(Sale.workspace_id == ws_id)\
     .group_by(ProductCategory.name)\
     .order_by(desc("category_rev")).limit(5).all()

    top_categories = [{
        "category": c.category_name,
        "units_sold": int(c.units_sold),
        "revenue": round(float(c.category_rev), 2),
        "percentage": round(float(c.category_rev) / gross_revenue * 100, 1) if gross_revenue > 0 else 0.0
    } for c in cat_sales]

    return {
        "revenue_summary": {
            "gross_revenue": round(gross_revenue, 2),
            "net_profit": net_profit,
            "profit_margin_pct": profit_margin_pct,
            "cogs": round(cogs, 2),
            "gst_collected": round(total_gst, 2),
            "discounts_given": round(total_discounts, 2),
            "total_orders": total_orders
        },
        "inventory_valuation": {
            "units_in_stock": total_units_in_stock,
            "cost_valuation": round(inv_cost_value, 2),
            "retail_valuation": round(inv_retail_value, 2),
            "unrealized_profit": potential_margin
        },
        "payment_breakdown": payment_breakdown,
        "top_categories": top_categories
    }
