"""Конфиг бота."""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	"""Настройки Telegram-бота."""

	model_config = SettingsConfigDict(
		env_file=Path(__file__).resolve().parents[2] / "backend" / ".env",
		env_file_encoding="utf-8",
		extra="ignore",
	)

	telegram_bot_token: str = Field(default="", alias="TELEGRAM_BOT_TOKEN")
	backend_url: str = Field(default="http://localhost:8000", alias="BACKEND_URL")
	bot_secret: str = Field(default="", alias="BOT_SECRET")
	courier_cache_ttl_seconds: int = Field(default=300, alias="COURIER_CACHE_TTL_SECONDS")


settings = Settings()
