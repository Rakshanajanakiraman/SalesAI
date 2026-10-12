from fastapi import APIRouter
from app.api.v1 import (
    auth,
    datasets,
    analytics,
    customers,
    products,
    sales,
    inventory,
    invoices,
    ml,
    promotions,
    feedback,
    reports
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(datasets.router)
api_router.include_router(analytics.router)
api_router.include_router(customers.router)
api_router.include_router(products.router)
api_router.include_router(sales.router)
api_router.include_router(inventory.router)
api_router.include_router(invoices.router)
api_router.include_router(ml.router)
api_router.include_router(promotions.router)
api_router.include_router(feedback.router)
api_router.include_router(reports.router)
