from fastapi import APIRouter
from app.routers.auth import router as auth_router
from app.routers.health import router as health_router

api_router = APIRouter()

# Core routes
api_router.include_router(health_router)
api_router.include_router(auth_router)

# Include domain routers here when ready, e.g.:
# from app.routers.users import router as users_router
# from app.routers.projects import router as projects_router
# from app.routers.tasks import router as tasks_router
# from app.routers.project_members import router as project_members_router
#
# api_router.include_router(users_router)
# api_router.include_router(projects_router)
# api_router.include_router(tasks_router)
# api_router.include_router(project_members_router)

__all__ = ["api_router"]
