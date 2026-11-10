from fastapi import APIRouter
from app.routers.health import router as health_router

api_router = APIRouter()

# Core routes
api_router.include_router(health_router)

__all__ = ["api_router"]

