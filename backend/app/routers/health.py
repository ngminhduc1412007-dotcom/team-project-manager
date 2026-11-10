from fastapi import APIRouter
from app.core.config import settings
from app.core.response import success_response
from app.schemas.common import DataResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=DataResponse[dict])
def health_check():
    """Health check endpoint to verify backend service availability."""
    return success_response(
        data={
            "app_name": settings.PROJECT_NAME,
            "environment": settings.APP_ENV,
            "status": "healthy",
        },
        message="Service is running normally",
    )