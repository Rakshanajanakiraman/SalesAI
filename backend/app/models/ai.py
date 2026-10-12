from sqlalchemy import Column, String, Integer, Float, Numeric, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import generate_uuid, get_utc_now

class CustomerSegment(Base):
    __tablename__ = "customer_segments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    segment_label = Column(String(100), nullable=False) # 'High-Value Champions', 'Loyal Customers', 'Potential Loyalists', 'At-Risk Inactive'
    recency_days = Column(Integer, default=0)
    frequency_count = Column(Integer, default=0)
    monetary_total = Column(Numeric(12, 2), default=0.0)
    silhouette_score = Column(Float, default=0.0)
    computed_at = Column(DateTime, default=get_utc_now)

    customer = relationship("Customer")

class SalesForecast(Base):
    __tablename__ = "sales_forecasts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    forecast_date = Column(Date, nullable=False, index=True)
    predicted_revenue = Column(Numeric(12, 2), nullable=False)
    lower_bound = Column(Numeric(12, 2), nullable=False)
    upper_bound = Column(Numeric(12, 2), nullable=False)
    model_name = Column(String(100), default="Time-Series Regressor")
    mae = Column(Float, default=0.0)
    rmse = Column(Float, default=0.0)
    r2_score = Column(Float, default=0.0)
    computed_at = Column(DateTime, default=get_utc_now)

class ChurnPrediction(Base):
    __tablename__ = "churn_predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    churn_probability = Column(Float, nullable=False) # 0.0 - 1.0
    risk_level = Column(String(50), nullable=False) # 'Low', 'Medium', 'High'
    primary_reason = Column(Text, nullable=False)
    retention_recommendation = Column(Text, nullable=False)
    accuracy = Column(Float, default=0.0)
    precision = Column(Float, default=0.0)
    recall = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    computed_at = Column(DateTime, default=get_utc_now)

    customer = relationship("Customer")

class ProductRecommendation(Base):
    __tablename__ = "product_recommendations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    source_product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    recommended_product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    confidence_score = Column(Float, nullable=False) # 0.0 - 1.0
    rule_type = Column(String(100), default="frequent_co_purchase") # frequent_co_purchase, upsell, cross_sell
    explanation = Column(Text, nullable=False)
    computed_at = Column(DateTime, default=get_utc_now)

    source_product = relationship("Product", foreign_keys=[source_product_id])
    recommended_product = relationship("Product", foreign_keys=[recommended_product_id])

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    record_type = Column(String(50), nullable=False) # 'sale', 'inventory'
    record_id = Column(String(100), nullable=False)
    severity = Column(String(50), default="medium") # 'low', 'medium', 'high', 'critical'
    anomaly_score = Column(Float, default=0.0)
    description = Column(Text, nullable=False)
    status = Column(String(50), default="unresolved") # 'unresolved', 'investigated', 'resolved'
    detected_at = Column(DateTime, default=get_utc_now)
