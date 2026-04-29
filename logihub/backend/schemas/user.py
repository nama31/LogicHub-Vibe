"""Схемы пользователя."""

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    """Создание пользователя."""
    name: str = Field(...)
    role: str = Field(...)
    password: Optional[str] = Field(None)
    phone: Optional[str] = Field(None)

class UserUpdate(BaseModel):
    """Обновление пользователя."""
    name: Optional[str] = Field(None)
    role: Optional[str] = Field(None)
    phone: Optional[str] = Field(None)
    is_active: Optional[bool] = Field(None)

class UserOut(BaseModel):
    """Пользователь для ответа."""
    id: UUID = Field(...)
    name: str = Field(...)
    role: str = Field(...)
    tg_id: Optional[int] = Field(None)
    phone: Optional[str] = Field(None)
    is_active: bool = Field(...)
    created_at: datetime = Field(...)

    class Config:
        from_attributes = True
