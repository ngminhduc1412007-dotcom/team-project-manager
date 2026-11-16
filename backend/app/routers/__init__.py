from fastapi import APIRouter
from app.routers.auth import router as auth_router
from app.routers.health import router as health_router
from app.routers.users import router as users_router

api_router = APIRouter()

# Core routes
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)

__all__ = ["api_router"]

