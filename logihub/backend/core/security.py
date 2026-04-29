"""Функции безопасности (JWT, хеширование паролей)."""

from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
from jose import jwt

from core.config import settings


ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


def verify_password(plain_password: str, hashed_password: str) -> bool:
	"""Проверить пароль."""

	return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def get_password_hash(password: str) -> str:
	"""Получить bcrypt-хеш пароля."""

	return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(subject: str, expires_delta: timedelta | None = None, extra_claims: dict[str, Any] | None = None) -> str:
	"""Создать JWT access token."""

	if not settings.jwt_secret:
		raise RuntimeError("JWT_SECRET is not configured")

	expire = datetime.now(UTC) + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
	payload: dict[str, Any] = {"sub": subject, "exp": expire}

	if extra_claims:
		payload.update(extra_claims)

	return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)
