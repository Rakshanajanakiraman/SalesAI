import io
import csv
from datetime import datetime, timezone, date
from decimal import Decimal
from typing import List, Dict, Any, Optional
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.dataset import Dataset
from app.models.customer import Customer
from app.models.product import Product, ProductCategory
from app.models.sale import Sale, SaleItem
from app.models.invoice import Invoice, Payment
from app.models.inventory import Inventory
from app.api.deps import get_current_user, require_roles
from app.services.sample_generator import seed_sample_dataset, run_sample_ml_pipeline

router = APIRouter(prefix="/datasets", tags=["Datasets"])

@router.get("/list")
def list_datasets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    datasets = db.query(Dataset).filter(Dataset.workspace_id == current_user.workspace_id).order_by(Dataset.created_at.desc()).all()
    if not datasets:
        ds = Dataset(
            workspace_id=current_user.workspace_id,
            name="MarketMind AI Sample Dataset",
            source_type="sample",
            row_count=2500,
            is_active=True
        )
        db.add(ds)
        db.commit()
        datasets = [ds]
    return {"datasets": datasets}

@router.post("/seed-sample")
def load_sample_dataset(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Seeds the realistic Indian retail dataset for the current user's workspace.
    """
    res = seed_sample_dataset(db, workspace_id=current_user.workspace_id, force_reset=True)
    db.query(Dataset).filter(Dataset.workspace_id == current_user.workspace_id).update({"is_active": False})
    sample_ds = db.query(Dataset).filter(
        Dataset.workspace_id == current_user.workspace_id,
        Dataset.name == "MarketMind AI Sample Dataset"
    ).first()
    if sample_ds:
        sample_ds.is_active = True
        db.commit()

    return {"status": "success", "message": "MarketMind AI Sample Dataset loaded successfully!", "details": res}

@router.post("/set-active/{dataset_id}")
def set_active_dataset(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    target = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.workspace_id == current_user.workspace_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Dataset not found in this workspace.")

    db.query(Dataset).filter(Dataset.workspace_id == current_user.workspace_id).update({"is_active": False})
    target.is_active = True
    db.commit()
    return {"status": "success", "active_dataset": target.name}

@router.post("/preview-csv")
async def preview_csv(file: UploadFile = File(...), current_user: User = Depends(get_current_user)):
    """
    Inspects an uploaded CSV file, detects columns, suggests mappings,
    and checks whether required columns for AI analysis are present.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Please upload a valid CSV file (.csv).")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents), nrows=25)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {str(e)}")

    headers = [str(c).strip() for c in df.columns]

    # Smart column mapping dictionary
    synonyms = {
        "customer_name": ["customer", "customer_name", "client", "name", "buyer"],
        "customer_email": ["email", "customer_email", "mail"],
        "customer_phone": ["phone", "mobile", "contact", "phone_number"],
        "customer_city": ["city", "location", "town"],
        "product_name": ["product", "product_name", "item", "item_name", "title"],
        "category": ["category", "cat", "product_category", "department"],
        "quantity": ["quantity", "qty", "units", "count"],
        "unit_price": ["price", "unit_price", "rate", "selling_price"],
        "sale_date": ["date", "sale_date", "timestamp", "transaction_date", "invoice_date"],
        "total_amount": ["total", "total_amount", "amount", "revenue", "line_total"],
        "payment_method": ["payment_mode", "payment_method", "payment", "mode"]
    }

    detected_mapping = {}
    lower_headers = {h.lower(): h for h in headers}

    for standard_col, syn_list in synonyms.items():
        matched = None
        for syn in syn_list:
            if syn in lower_headers:
                matched = lower_headers[syn]
                break
        detected_mapping[standard_col] = matched

    # Verification of AI Requirements
    warnings = []
    if not detected_mapping.get("sale_date"):
        warnings.append("Missing 'Sale Date': Historical dates are required for AI Sales Forecasting.")
    if not detected_mapping.get("customer_name") and not detected_mapping.get("customer_email"):
        warnings.append("Missing Customer identifiers: Required for Customer Segmentation and Churn Prediction.")
    if not detected_mapping.get("product_name"):
        warnings.append("Missing 'Product Name': Required for Product Recommendation Engine.")

    preview_rows = df.fillna("").head(10).to_dict(orient="records")

    return {
        "filename": file.filename,
        "total_columns_detected": len(headers),
        "headers": headers,
        "suggested_mapping": detected_mapping,
        "ai_readiness_warnings": warnings,
        "preview_rows": preview_rows
    }

@router.post("/confirm-import")
async def confirm_import(
    file: UploadFile = File(...),
    dataset_name: str = Form(...),
    mapping_json: str = Form(...),
    current_user: User = Depends(require_roles(["business_owner", "system_admin"])),
    db: Session = Depends(get_db)
):
    """
    Ingests user-mapped CSV rows into PostgreSQL transactions under the user's workspace.
    """
    import json
    try:
        column_map = json.loads(mapping_json)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid column mapping format.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    ws_id = current_user.workspace_id

    # Create new Dataset entity
    new_dataset = Dataset(
        workspace_id=ws_id,
        name=dataset_name or f"Imported CSV ({file.filename})",
        source_type="uploaded_csv",
        file_name=file.filename,
        row_count=len(df),
        is_active=True,
        description=f"User-uploaded dataset imported on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}"
    )
    # Deactivate existing
    db.query(Dataset).filter(Dataset.workspace_id == ws_id).update({"is_active": False})
    db.add(new_dataset)
    db.flush()

    # Process rows
    cust_col = column_map.get("customer_name")
    prod_col = column_map.get("product_name")
    price_col = column_map.get("unit_price")
    qty_col = column_map.get("quantity")
    date_col = column_map.get("sale_date")
    total_col = column_map.get("total_amount")
    cat_col = column_map.get("category")

    imported_sales = 0
    today = datetime.now(timezone.utc)

    for idx, row in df.iterrows():
        # Customer handling
        cust_name = str(row.get(cust_col, f"Customer {idx+1}")).strip() if cust_col else f"Customer {idx+1}"
        customer = db.query(Customer).filter(Customer.workspace_id == ws_id, Customer.full_name == cust_name).first()
        if not customer:
            customer = Customer(
                workspace_id=ws_id,
                customer_code=f"CUST-IMP-{1000 + idx}",
                full_name=cust_name,
                email=f"cust_{idx+1}@imported.com",
                phone="+91 9000000000",
                city="Bengaluru",
                customer_type="Retail",
                status="Active",
                registration_date=date.today()
            )
            db.add(customer)
            db.flush()

        # Product handling
        p_name = str(row.get(prod_col, f"Product Item {idx+1}")).strip() if prod_col else f"Product Item {idx+1}"
        product = db.query(Product).filter(Product.workspace_id == ws_id, Product.product_name == p_name).first()
        if not product:
            try:
                u_price = Decimal(str(row.get(price_col, 100.0)))
            except Exception:
                u_price = Decimal("100.0")

            product = Product(
                workspace_id=ws_id,
                sku=f"SKU-IMP-{100 + idx}",
                product_name=p_name,
                selling_price=u_price,
                purchase_price=round(u_price * Decimal("0.7"), 2),
                gst_rate=Decimal("18.0"),
                status="Active"
            )
            db.add(product)
            db.flush()

            inv = Inventory(
                workspace_id=ws_id,
                product_id=product.id,
                current_stock=50,
                reorder_level=10,
                warehouse_location="Warehouse Main"
            )
            db.add(inv)
            db.flush()

        # Date handling
        s_date = today
        if date_col and str(row.get(date_col)):
            try:
                parsed_d = pd.to_datetime(row[date_col]).to_pydatetime()
                s_date = parsed_d.replace(tzinfo=timezone.utc)
            except Exception:
                s_date = today

        # Total handling
        try:
            qty = int(row.get(qty_col, 1))
        except Exception:
            qty = 1

        try:
            line_tot = Decimal(str(row.get(total_col, product.selling_price * qty)))
        except Exception:
            line_tot = product.selling_price * Decimal(str(qty))

        sale_num = f"INV-IMP-{2025}-{1000 + idx}"
        sale = Sale(
            workspace_id=ws_id,
            sale_number=sale_num,
            customer_id=customer.id,
            salesperson_id=current_user.id,
            subtotal=line_tot,
            total_amount=line_tot,
            payment_method="UPI",
            sale_date=s_date,
            items=[SaleItem(
                product_id=product.id,
                quantity=qty,
                unit_price=product.selling_price,
                line_total=line_tot
            )]
        )
        db.add(sale)
        imported_sales += 1

    db.commit()

    # Trigger ML recalculation for newly imported workspace dataset
    try:
        run_sample_ml_pipeline(db, ws_id)
    except Exception as e:
        print("ML re-calculation warning on CSV import:", e)

    return {
        "status": "success",
        "message": f"Successfully ingested {imported_sales} sales transactions into PostgreSQL!",
        "dataset_id": new_dataset.id,
        "rows_processed": imported_sales
    }

@router.get("/active")
def get_active_dataset_details(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws_id = current_user.workspace_id
    active_ds = db.query(Dataset).filter(Dataset.workspace_id == ws_id, Dataset.is_active == True).first()
    if not active_ds:
        active_ds = db.query(Dataset).filter(Dataset.workspace_id == ws_id).order_by(Dataset.created_at.desc()).first()

    total_customers = db.query(Customer).filter(Customer.workspace_id == ws_id).count()
    total_products = db.query(Product).filter(Product.workspace_id == ws_id).count()
    total_sales = db.query(Sale).filter(Sale.workspace_id == ws_id).count()

    recent_customers = db.query(Customer).filter(Customer.workspace_id == ws_id).order_by(Customer.created_at.desc()).limit(5).all()
    recent_products = db.query(Product).filter(Product.workspace_id == ws_id).order_by(Product.created_at.desc()).limit(5).all()

    return {
        "dataset": {
            "id": active_ds.id if active_ds else None,
            "name": active_ds.name if active_ds else "MarketMind AI Master Dataset",
            "source_type": active_ds.source_type if active_ds else "sample",
            "row_count": active_ds.row_count if active_ds else (total_sales + total_customers + total_products),
            "is_active": True,
            "created_at": active_ds.created_at if active_ds else None
        },
        "stats": {
            "total_customers": total_customers,
            "total_products": total_products,
            "total_sales": total_sales,
            "total_items": total_sales + total_customers + total_products
        },
        "recent_customers": [{
            "id": c.id,
            "name": c.full_name,
            "phone": c.phone,
            "city": c.city,
            "type": c.customer_type,
            "code": c.customer_code
        } for c in recent_customers],
        "recent_products": [{
            "id": p.id,
            "name": p.product_name,
            "sku": p.sku,
            "selling_price": float(p.selling_price),
            "cost_price": float(p.purchase_price)
        } for p in recent_products]
    }

@router.get("/records")
def get_dataset_records(
    record_type: str = Query("customers", pattern="^(customers|products|sales)$"),
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ws_id = current_user.workspace_id
    if record_type == "customers":
        query = db.query(Customer).filter(Customer.workspace_id == ws_id).order_by(Customer.created_at.desc())
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return {
            "record_type": "customers",
            "total": total,
            "records": [{
                "id": c.id,
                "code": c.customer_code,
                "name": c.full_name,
                "phone": c.phone,
                "email": c.email,
                "city": c.city,
                "state": c.state,
                "type": c.customer_type,
                "created_at": str(c.created_at) if hasattr(c, "created_at") else None
            } for c in items]
        }
    elif record_type == "products":
        query = db.query(Product).filter(Product.workspace_id == ws_id).order_by(Product.created_at.desc())
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        records = []
        for p in items:
            inv = db.query(Inventory).filter(Inventory.product_id == p.id).first()
            records.append({
                "id": p.id,
                "sku": p.sku,
                "name": p.product_name,
                "brand": p.brand,
                "category": p.category.name if p.category else "General",
                "cost_price": float(p.purchase_price),
                "selling_price": float(p.selling_price),
                "gst_rate": float(p.gst_rate),
                "stock": inv.current_stock if inv else 0
            })
        return {
            "record_type": "products",
            "total": total,
            "records": records
        }
    else:
        query = db.query(Sale).filter(Sale.workspace_id == ws_id).order_by(Sale.sale_date.desc())
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return {
            "record_type": "sales",
            "total": total,
            "records": [{
                "id": s.id,
                "sale_number": s.sale_number,
                "total_amount": float(s.total_amount),
                "payment_method": s.payment_method,
                "sale_date": str(s.sale_date),
                "items_count": len(s.items)
            } for s in items]
        }

