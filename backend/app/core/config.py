"""Đọc cấu hình từ file .env (hoặc biến môi trường).

Muốn thêm cấu hình mới: thêm 1 dòng vào class Settings + thêm vào .env.example.
"""
from pathlib import Path
from typing import Optional
from urllib.parse import quote_plus
from pydantic_settings import BaseSettings, SettingsConfigDict

# Đường dẫn tuyệt đối tới file backend/.env
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE_PATH = BASE_DIR / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH) if ENV_FILE_PATH.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "Team Project Manager API"
    PROJECT_NAME: str = "Team Project Manager API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # MySQL connection settings
    DB_HOST: str = "127.0.0.1"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "team_project_manager"
    DATABASE_URL: Optional[str] = None

    # CORS Settings
    CORS_ORIGINS: str = "*"
    BACKEND_CORS_ORIGINS: Optional[str] = None

    # Auth / JWT
    SECRET_KEY: str = "default-insecure-secret-key-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    @property
    def database_url(self) -> str:
        """Trả về URL kết nối cơ sở dữ liệu SQLAlchemy."""
        if self.DATABASE_URL and "${" not in self.DATABASE_URL:
            return self.DATABASE_URL
        # mysql+pymysql://user:password@host:port/database
        # quote_plus: để mật khẩu có ký tự đặc biệt (@, #, /...) không làm hỏng URL
        encoded_password = quote_plus(self.DB_PASSWORD) if self.DB_PASSWORD else ""
        return (
            f"mysql+pymysql://{self.DB_USER}:{encoded_password}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"
        )

    @property
    def cors_origin_list(self) -> list[str]:
        raw = self.BACKEND_CORS_ORIGINS or self.CORS_ORIGINS
        if raw == "*":
            return ["*"]
        return [origin.strip() for origin in raw.split(",") if origin.strip()]


settings = Settings()