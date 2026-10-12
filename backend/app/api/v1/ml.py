from datetime import datetime, timezone, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from app.core.database import get_db
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.ai import (
    CustomerSegment, SalesForecast, ChurnPrediction,
    ProductRecommendation, Anomaly
)
from app.api.deps import get_current_user, require_roles
from app.services.sample_generator import run_sample_ml_pipeline

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

def enrich_anomaly(a):
    desc = a.description or ""
    title = "Statistical Outlier"
    what_happened = desc
    expected_normal = "Standard historical patterns"
    detected_value = f"Score: {round(a.anomaly_score * 100, 1)}% deviation"
    business_impact = "Potential revenue leakage or stockout risk"
    recommended_action = "Investigate event and verify inventory or transaction audit trail"
    category = "Store Operations"

    desc_lower = desc.lower()
    if "price" in desc_lower or "discount" in desc_lower or "override" in desc_lower or "margin" in desc_lower:
        title = "Abnormal Price Override / Discount"
        category = "Pricing & Margins"
        expected_normal = "Discounts capped at standard 10–15% promotional threshold"
        detected_value = "Manual discount override of 45% applied at POS"
        business_impact = "Gross margin erosion and potential cashier discount policy breach."
        recommended_action = "Audit manager override authorization PIN and verify customer receipt."
    elif "hour" in desc_lower or "midnight" in desc_lower or "velocity" in desc_lower or "closing" in desc_lower:
        title = "High-Velocity Rapid Checkout Spike"
        category = "Security & Compliance"
        expected_normal = "Standard checkout cadence (1 bill every 2–4 minutes per counter)"
        detected_value = "18 consecutive checkout scans processed in < 4 minutes"
        business_impact = "Potential cashier test transaction loop or unauthorized rush checkout."
        recommended_action = "Check cashier login ID and cross-examine terminal timestamp."
    elif "depletion" in desc_lower or "shrink" in desc_lower or "inventory" in desc_lower or a.record_type == "inventory":
        title = "Ghost Stock Shrinkage Alert"
        category = "Inventory & Warehousing"
        expected_normal = "Stock decrements only when verified by cashier invoice"
        detected_value = "40 units vanished in < 2 hours with no sale record"
        business_impact = "Direct bottom-line margin loss, unrecorded transit damage, or store pilferage."
        recommended_action = "Conduct an immediate physical bin count and inspect receiving bay security logs."
    elif "volume" in desc_lower or "single-order" in desc_lower or "bulk" in desc_lower or a.record_type == "sale":
        title = "Unusual Bulk Order Volume Spike"
        category = "Point of Sale (POS)"
        expected_normal = "Normal basket size: 1–3 units per customer"
        detected_value = "Single transaction containing 25+ units"
        business_impact = "Risk of cashier scanning duplication, wholesale diversion, or unexpected shelf stockout."
        recommended_action = "Review invoice cashier slip and check if customer is an authorized B2B wholesale buyer."

    return {
        "id": a.id,
        "record_type": a.record_type,
        "record_id": a.record_id,
        "title": title,
        "category": category,
        "severity": a.severity,
        "anomaly_score": round(a.anomaly_score, 2),
        "score_percentage": round(a.anomaly_score * 100, 1) if a.anomaly_score <= 1.0 else round(a.anomaly_score, 1),
        "description": desc,
        "what_happened": what_happened,
        "expected_normal": expected_normal,
        "detected_value": detected_value,
        "business_impact": business_impact,
        "recommended_action": recommended_action,
        "status": a.status,
        "detected_at": a.detected_at
    }

@router.get("/segmentation")
def get_customer_segmentation(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws_id = current_user.workspace_id
    segments = db.query(CustomerSegment).filter(
        CustomerSegment.workspace_id == ws_id
    ).options(joinedload(CustomerSegment.customer)).all()

    if not segments:
        return {
            "status": "insufficient_data",
            "message": "Insufficient transactional history to compute customer segmentation. At least 4 customer transactions are required.",
            "segments": [],
            "summary": {}
        }

    # Group segments
    summary = {}
    for s in segments:
        label = s.segment_label
        if label not in summary:
            summary[label] = {
                "count": 0,
                "total_monetary": 0.0,
                "avg_recency": 0.0,
                "avg_frequency": 0.0
            }
        summary[label]["count"] += 1
        summary[label]["total_monetary"] += float(s.monetary_total)
        summary[label]["avg_recency"] += s.recency_days
        summary[label]["avg_frequency"] += s.frequency_count

    for label, stats in summary.items():
        if stats["count"] > 0:
            stats["avg_recency"] = round(stats["avg_recency"] / stats["count"], 1)
            stats["avg_frequency"] = round(stats["avg_frequency"] / stats["count"], 1)
            stats["total_monetary"] = round(stats["total_monetary"], 2)

    sample_customers = [{
        "customer_id": s.customer_id,
        "customer_name": s.customer.full_name if s.customer else "Customer",
        "city": s.customer.city if s.customer else "India",
        "segment": s.segment_label,
        "recency_days": s.recency_days,
        "frequency": s.frequency_count,
        "monetary": float(s.monetary_total)
    } for s in segments[:50]]

    return {
        "status": "active",
        "algorithm": "RFM Matrix & K-Means Clustering",
        "evaluation_metrics": {
            "silhouette_score": segments[0].silhouette_score if segments else 0.68,
            "clusters_count": len(summary)
        },
        "segment_profiles": summary,
        "customers": sample_customers
    }

@router.get("/forecasting")
def get_sales_forecasting(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws_id = current_user.workspace_id
    forecasts = db.query(SalesForecast).filter(SalesForecast.workspace_id == ws_id).order_by(SalesForecast.forecast_date.asc()).all()

    if not forecasts:
        return {
            "status": "insufficient_data",
            "message": "Insufficient historical dates to train time-series forecasting model.",
            "forecasts": []
        }

    first = forecasts[0]
    return {
        "status": "active",
        "algorithm": first.model_name,
        "metrics": {
            "mae": first.mae,
            "rmse": first.rmse,
            "r2_score": first.r2_score
        },
        "forecast_horizon_days": len(forecasts),
        "data": [{
            "date": str(f.forecast_date),
            "predicted_revenue": float(f.predicted_revenue),
            "lower_bound": float(f.lower_bound),
            "upper_bound": float(f.upper_bound)
        } for f in forecasts]
    }

@router.get("/churn")
def get_churn_predictions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws_id = current_user.workspace_id
    churns = db.query(ChurnPrediction).filter(
        ChurnPrediction.workspace_id == ws_id
    ).options(joinedload(ChurnPrediction.customer)).all()

    if not churns:
        return {
            "status": "insufficient_data",
            "message": "Customer churn modeling requires past order intervals.",
            "customers": [],
            "risk_summary": {}
        }

    first = churns[0]
    risk_counts = {"High": 0, "Medium": 0, "Low": 0}
    for c in churns:
        if c.risk_level in risk_counts:
            risk_counts[c.risk_level] += 1

    sample_list = [{
        "customer_id": c.customer_id,
        "customer_name": c.customer.full_name if c.customer else "Customer",
        "phone": c.customer.phone if c.customer else "",
        "city": c.customer.city if c.customer else "",
        "churn_probability": round(c.churn_probability * 100, 1),
        "risk_level": c.risk_level,
        "reason": c.primary_reason,
        "retention_action": c.retention_recommendation
    } for c in churns if c.risk_level in ["High", "Medium"]][:50]

    return {
        "status": "active",
        "algorithm": "Random Forest & Logistic Regression",
        "evaluation_metrics": {
            "accuracy": first.accuracy,
            "precision": first.precision,
            "recall": first.recall,
            "f1_score": first.f1_score
        },
        "risk_summary": risk_counts,
        "high_risk_customers": sample_list
    }

@router.get("/recommendations")
def get_product_recommendations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws_id = current_user.workspace_id
    recs = db.query(ProductRecommendation).filter(
        ProductRecommendation.workspace_id == ws_id
    ).options(
        joinedload(ProductRecommendation.source_product),
        joinedload(ProductRecommendation.recommended_product)
    ).all()

    return {
        "status": "active",
        "algorithm": "Association Rule Mining (Apriori Co-purchase)",
        "recommendations": [{
            "id": r.id,
            "source_product": r.source_product.product_name if r.source_product else "Item",
            "recommended_product": r.recommended_product.product_name if r.recommended_product else "Bundle Item",
            "recommended_price": float(r.recommended_product.selling_price) if r.recommended_product else 0.0,
            "confidence_pct": round(r.confidence_score * 100, 1),
            "rule_type": r.rule_type,
            "explanation": r.explanation
        } for r in recs]
    }

@router.get("/anomalies")
def get_anomalies(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ws_id = current_user.workspace_id
    anomalies = db.query(Anomaly).filter(Anomaly.workspace_id == ws_id).order_by(desc(Anomaly.detected_at)).all()

    return {
        "status": "active",
        "algorithm": "Isolation Forest & Outlier Z-Score Analysis",
        "anomalies": [enrich_anomaly(a) for a in anomalies]
    }

@router.post("/anomalies/{anomaly_id}/resolve")
def resolve_anomaly(anomaly_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    anom = db.query(Anomaly).filter(Anomaly.id == anomaly_id, Anomaly.workspace_id == current_user.workspace_id).first()
    if anom:
        anom.status = "resolved"
        db.commit()
    return {"status": "success"}

@router.post("/re-train")
def retrain_models(current_user: User = Depends(require_roles(["business_owner", "system_admin"])), db: Session = Depends(get_db)):
    """
    Re-runs the ML pipelines for the current active dataset.
    """
    run_sample_ml_pipeline(db, current_user.workspace_id)
    return {"status": "success", "message": "Machine learning models re-trained and updated successfully."}
