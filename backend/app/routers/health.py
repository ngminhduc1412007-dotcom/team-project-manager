from fastapi import APIRouter, Request, status
from app.core.config import settings
from app.core.response import create_response
from app.schemas.common import ResponseModel

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=ResponseModel)
def health_check(request: Request):
    """Health check endpoint to verify backend service availability."""
    return create_response(
        request=request,
        status_code=status.HTTP_200_OK,
        message="Service is running normally",
        data={
            "app_name": settings.PROJECT_NAME,
            "environment": settings.APP_ENV,
            "status": "healthy",
        },
    )