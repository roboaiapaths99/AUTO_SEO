"""
AutoSEO AI Platform — Application Configuration
=================================================
Uses Pydantic BaseSettings for type-safe environment variable loading.
All settings are loaded from .env file or environment variables.
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── App ──────────────────────────────────────────────
    APP_NAME: str = "AutoSEO AI Platform"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    # ── MongoDB ──────────────────────────────────────────
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "autoseo"
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── JWT Authentication ───────────────────────────────
    JWT_SECRET_KEY: str = "dev-secret-key-autoseo-platform-2026-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ENCRYPTION_KEY: str = "30z-Y4H2X8v0H-N5H8z-Y4H2X8v0H-N5H8z-Y4H2X8v=" # Default for dev

    # ── CORS ─────────────────────────────────────────────
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # ── Google APIs (FREE) ───────────────────────────────
    GOOGLE_PSI_API_KEY: str = ""
    GOOGLE_CSE_API_KEY: str = ""
    GOOGLE_CSE_CX: str = ""
    GOOGLE_SEARCH_CONSOLE_CREDENTIALS_PATH: str = "credentials/gsc_credentials.json"

    # ── Gemini AI (FREE tier) ────────────────────────────
    GEMINI_API_KEY: str = ""

    # ── DataForSEO (PAID — add later) ────────────────────
    DATAFORSEO_LOGIN: str = ""
    DATAFORSEO_PASSWORD: str = ""

    # ── SerpAPI (PAID — add later) ───────────────────────
    SERPAPI_KEY: str = ""

    # ── Crawler Settings ─────────────────────────────────
    CRAWLER_MAX_PAGES: int = 100
    CRAWLER_TIMEOUT: int = 10
    CRAWLER_USER_AGENT: str = "AutoSEO-Bot/1.0 (+https://autoseo.ai/bot)"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def has_google_psi(self) -> bool:
        return bool(self.GOOGLE_PSI_API_KEY)

    @property
    def has_google_cse(self) -> bool:
        return bool(self.GOOGLE_CSE_API_KEY and self.GOOGLE_CSE_CX)

    @property
    def has_gemini(self) -> bool:
        return bool(self.GEMINI_API_KEY)

    @property
    def has_dataforseo(self) -> bool:
        return bool(self.DATAFORSEO_LOGIN and self.DATAFORSEO_PASSWORD)

    @property
    def has_serpapi(self) -> bool:
        return bool(self.SERPAPI_KEY)

    @property
    def has_redis(self) -> bool:
        return bool(self.REDIS_URL)

    class Config:
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        env_file_encoding = "utf-8"
        case_sensitive = True


# Singleton settings instance
settings = Settings()
