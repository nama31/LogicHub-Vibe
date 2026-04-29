"""Схемы заказа."""

from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional

class OrderCreate(BaseModel):
    """Создание заказа."""
    product_id: UUID = Field(...)
    quantity: int = Field(...)
    sale_price: int = Field(...)
    courier_fee: int = Field(default=0)
    customer_name: Optional[str] = Field(None)
    customer_phone: Optional[str] = Field(None)
    delivery_address: str = Field(...)
    note: Optional[str] = Field(None)

class OrderUpdate(BaseModel):
    """Обновление заказа."""
    product_id: Optional[UUID] = Field(None)
    quantity: Optional[int] = Field(None)
    sale_price: Optional[int] = Field(None)
    courier_fee: Optional[int] = Field(None)
    customer_name: Optional[str] = Field(None)
    customer_phone: Optional[str] = Field(None)
    delivery_address: Optional[str] = Field(None)
    status: Optional[str] = Field(None)
    note: Optional[str] = Field(None)

class OrderOut(BaseModel):
    """Заказ для ответа."""
    id: UUID = Field(...)
    product_id: UUID = Field(...)
    courier_id: Optional[UUID] = Field(None)
    quantity: int = Field(...)
    sale_price: int = Field(...)
    courier_fee: int = Field(...)
    customer_name: Optional[str] = Field(None)
    customer_phone: Optional[str] = Field(None)
    delivery_address: str = Field(...)
    status: str = Field(...)
    note: Optional[str] = Field(None)
    created_at: datetime = Field(...)
    updated_at: datetime = Field(...)

    class Config:
        from_attributes = True

class OrderListOut(OrderOut):
    """Заказ в списке."""
    pass

class AssignRequest(BaseModel):
    """Назначение курьера."""
    courier_id: UUID = Field(...)
