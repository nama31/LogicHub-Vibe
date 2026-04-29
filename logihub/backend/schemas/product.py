"""Схемы товара."""

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional

class ProductCreate(BaseModel):
    """Создание товара."""
    title: str = Field(...)
    purchase_price: int = Field(...)
    stock_quantity: int = Field(default=0)
    unit: str = Field(default='шт')

class ProductUpdate(BaseModel):
    """Обновление товара."""
    title: Optional[str] = Field(None)
    purchase_price: Optional[int] = Field(None)
    stock_quantity: Optional[int] = Field(None)
    unit: Optional[str] = Field(None)

class ProductOut(BaseModel):
    """Товар для ответа."""
    id: UUID = Field(...)
    title: str = Field(...)
    purchase_price: int = Field(...)
    stock_quantity: int = Field(...)
    unit: str = Field(...)
    created_at: datetime = Field(...)
    updated_at: datetime = Field(...)

    class Config:
        from_attributes = True
