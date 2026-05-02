"""Схемы товара."""

from datetime import datetime
from uuid import UUID

from pydantic import AliasChoices, BaseModel, Field


class ProductBase(BaseModel):
    """Общие поля товара."""

    title: str = Field(..., min_length=1)
    purchase_price_som: int = Field(
        ..., ge=0, validation_alias=AliasChoices("purchase_price_som", "purchase_price")
    )
    stock_quantity: int = Field(..., ge=0)
    unit: str = Field(..., min_length=1)


class ProductCreate(ProductBase):
    """Создание товара."""


class ProductUpdate(BaseModel):
    """Обновление товара."""

    title: str | None = Field(None, min_length=1)
    purchase_price_som: int | None = Field(
        None, ge=0, validation_alias=AliasChoices("purchase_price_som", "purchase_price")
    )
    stock_quantity: int | None = Field(None, ge=0)
    unit: str | None = Field(None, min_length=1)

class ProductRestock(BaseModel):
    """Пополнение запасов."""
    
    amount: int = Field(..., gt=0)


class ProductOut(ProductBase):
    """Товар для ответа."""

    id: UUID = Field(...)
    created_at: datetime = Field(...)
    updated_at: datetime = Field(...)

    class Config:
        from_attributes = True
        populate_by_name = True
