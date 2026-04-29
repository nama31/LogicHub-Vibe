"""Схемы аутентификации."""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Запрос на логин."""

    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    """Ответ с токеном."""

    access_token: str = Field(..., min_length=1)
    token_type: str = Field(default="bearer", min_length=1)
