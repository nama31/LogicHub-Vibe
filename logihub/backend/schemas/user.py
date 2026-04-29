"""Схемы пользователя."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


UserRole = Literal["admin", "courier"]


class UserCreate(BaseModel):
    """Создание пользователя."""

    name: str = Field(..., min_length=1)
    role: UserRole = Field(...)
    tg_id: int | None = Field(None)
    password: str | None = Field(None, min_length=1)
    phone: str | None = Field(None, min_length=1)
    is_active: bool | None = Field(None)


class UserUpdate(BaseModel):
    """Обновление пользователя."""

    name: str | None = Field(None, min_length=1)
    role: UserRole | None = Field(None)
    tg_id: int | None = Field(None)
    phone: str | None = Field(None, min_length=1)
    is_active: bool | None = Field(None)
    password: str | None = Field(None, min_length=1)


class UserOut(BaseModel):
    """Пользователь для ответа."""

    id: UUID = Field(...)
    name: str = Field(...)
    role: UserRole = Field(...)
    tg_id: int | None = Field(None)
    phone: str | None = Field(None)
    is_active: bool = Field(...)
    created_at: datetime = Field(...)

    class Config:
        from_attributes = True
        populate_by_name = True
