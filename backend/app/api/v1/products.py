from typing import Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.user import User
from app.models.product import Product, ProductCategory, Supplier
from app.models.inventory import Inventory
from app.models.dataset import Dataset
from app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/")
def list_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.workspace_id == current_user.workspace_id)

    if q:
        query = query.filter(or_(
            Product.product_name.ilike(f"%{q}%"),
            Product.sku.ilike(f"%{q}%"),
            Product.brand.ilike(f"%{q}%")
        ))
    if category:
        query = query.join(ProductCategory).filter(ProductCategory.name == category)

    total = query.count()
    from sqlalchemy.orm import joinedload
    products = query.options(joinedload(Product.category)).order_by(Product.product_name.asc()).offset(skip).limit(limit).all()

    # Batch fetch inventory records in 1 query instead of N individual queries
    product_ids = [p.id for p in products]
    inv_map = {}
    if product_ids:
        inv_records = db.query(Inventory).filter(
            Inventory.product_id.in_(product_ids),
            Inventory.workspace_id == current_user.workspace_id
        ).all()
        inv_map = {inv.product_id: inv for inv in inv_records}

    results = []
    for p in products:
        inv = inv_map.get(p.id)
        results.append({
            "id": p.id,
            "sku": p.sku,
            "product_name": p.product_name,
            "category": p.category.name if p.category else "General",
            "subcategory": p.subcategory,
            "brand": p.brand,
            "purchase_price": float(p.purchase_price),
            "cost_price": float(p.purchase_price),
            "selling_price": float(p.selling_price),
            "gst_rate": float(p.gst_rate),
            "current_stock": inv.current_stock if inv else 0,
            "reorder_level": inv.reorder_level if inv else 10,
            "status": p.status
        })

    return {"total": total, "products": results}

@router.get("/categories")
def list_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cats = db.query(ProductCategory).filter(ProductCategory.workspace_id == current_user.workspace_id).all()
    if not cats:
        # Default retail categories if none yet in workspace
        defaults = ["Grocery & Staples", "Dairy & Beverages", "Personal Care & Hygiene", "Snacks & Packaged Food", "Home Cleaning", "Electronics"]
        for d in defaults:
            c = ProductCategory(workspace_id=current_user.workspace_id, name=d)
            db.add(c)
        db.commit()
        cats = db.query(ProductCategory).filter(ProductCategory.workspace_id == current_user.workspace_id).all()

    return [{"id": c.id, "name": c.name} for c in cats]

@router.get("/suggestions")
def get_product_suggestions(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Intelligent autocomplete suggestions for Product names (Prompt Section 23).
    """
    from sqlalchemy.orm import joinedload
    prods = db.query(Product).filter(
        Product.workspace_id == current_user.workspace_id,
        Product.product_name.ilike(f"%{q}%")
    ).options(joinedload(Product.inventory)).limit(10).all()

    return [{
        "id": p.id,
        "name": p.product_name,
        "sku": p.sku,
        "price": float(p.selling_price),
        "gst_rate": float(p.gst_rate),
        "current_stock": p.inventory.current_stock if p.inventory else 0
    } for p in prods]

@router.post("/")
def create_product(
    data: dict,
    current_user: User = Depends(require_roles(["business_owner", "store_manager", "system_admin"])),
    db: Session = Depends(get_db)
):
    ws_id = current_user.workspace_id

    # Category handling
    cat_id = data.get("category_id")
    if not cat_id and data.get("category"):
        cat = db.query(ProductCategory).filter(ProductCategory.workspace_id == ws_id, ProductCategory.name == data.get("category")).first()
        if not cat:
            cat = ProductCategory(workspace_id=ws_id, name=data.get("category"))
            db.add(cat)
            db.flush()
        cat_id = cat.id

    cost = data.get("purchase_price") if data.get("purchase_price") is not None else data.get("cost_price", 0.0)
    selling = data.get("selling_price", 0.0)
    sku = data.get("sku") or f"SKU-{db.query(Product).filter(Product.workspace_id == ws_id).count() + 1001}"

    prod = Product(
        workspace_id=ws_id,
        sku=sku,
        product_name=data.get("product_name"),
        category_id=cat_id,
        subcategory=data.get("subcategory"),
        brand=data.get("brand"),
        description=data.get("description"),
        purchase_price=Decimal(str(cost)),
        selling_price=Decimal(str(selling)),
        gst_rate=Decimal(str(data.get("gst_rate", 18.0))),
        status="Active"
    )
    db.add(prod)
    db.flush()

    # Initialize inventory
    stock = int(data.get("initial_stock", 25))
    reorder = int(data.get("reorder_level", 10))
    inv = Inventory(
        workspace_id=ws_id,
        product_id=prod.id,
        current_stock=stock,
        reorder_level=reorder,
        warehouse_location=data.get("warehouse_location", "Main Shelf")
    )
    db.add(inv)

    # Sync to active dataset
    active_ds = db.query(Dataset).filter(Dataset.workspace_id == ws_id, Dataset.is_active == True).first()
    if not active_ds:
        active_ds = db.query(Dataset).filter(Dataset.workspace_id == ws_id).order_by(Dataset.created_at.desc()).first()
        if not active_ds:
            active_ds = Dataset(
                workspace_id=ws_id,
                name="MarketMind AI Live Retail Dataset",
                source_type="live_db",
                row_count=0,
                is_active=True,
                description="Active workspace master dataset"
            )
            db.add(active_ds)
            db.flush()
        else:
            active_ds.is_active = True

    active_ds.row_count = (active_ds.row_count or 0) + 1
    db.commit()

    return {
        "status": "success",
        "message": f"Product '{prod.product_name}' stored in database & registered into dataset '{active_ds.name}'!",
        "product_id": prod.id,
        "id": prod.id,
        "product_name": prod.product_name,
        "sku": prod.sku,
        "selling_price": float(prod.selling_price),
        "cost_price": float(prod.purchase_price),
        "dataset": {
            "id": active_ds.id,
            "name": active_ds.name,
            "row_count": active_ds.row_count
        }
    }
