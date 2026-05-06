"""Настройки приложения (pydantic-settings)."""

from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Настройки приложения."""

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = Field(alias="DATABASE_URL")

    # 2. Add this block right here to intercept and fix the Heroku URL
    @field_validator("database_url", mode="before")
    @classmethod
    def fix_heroku_postgres_url(cls, v: str) -> str:
        if v and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        return v




    jwt_secret: str | None = Field(default=None, alias="JWT_SECRET")
    bot_secret: str | None = Field(default=None, alias="BOT_SECRET")
    telegram_bot_token: str | None = Field(default=None, alias="TELEGRAM_BOT_TOKEN")
    redis_url: str = Field(default="redis://localhost:6379", alias="REDIS_URL")
    whatsapp_api_url: str | None = Field(default=None, alias="WHATSAPP_API_URL")
    whatsapp_api_token: str | None = Field(default=None, alias="WHATSAPP_API_TOKEN")

settings = Settings()
