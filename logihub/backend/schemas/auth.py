"""Схемы аутентификации."""

from pydantic import BaseModel, Field

class LoginRequest(BaseModel):
    """Запрос на логин."""
    username: str = Field(...)
    password: str = Field(...)

class TokenResponse(BaseModel):
    """Ответ с токеном."""
    access_token: str = Field(...)
    token_type: str = Field(...)
