"""Настройки приложения (pydantic-settings)."""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Настройки приложения."""

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = Field(alias="DATABASE_URL")
    jwt_secret: str | None = Field(default=None, alias="JWT_SECRET")
    bot_secret: str | None = Field(default=None, alias="BOT_SECRET")
    telegram_bot_token: str | None = Field(default=None, alias="TELEGRAM_BOT_TOKEN")
    redis_url: str = Field(default="redis://localhost:6379", alias="REDIS_URL")


settings = Settings()
