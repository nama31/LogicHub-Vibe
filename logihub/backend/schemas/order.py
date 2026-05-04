"""Схемы заказа."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import AliasChoices, BaseModel, Field

from .product import ProductOut
from .user import UserOut


OrderStatus = Literal["pending", "new", "assigned", "in_transit", "delivered", "failed"]


class OrderCreate(BaseModel):
    """Создание заказа."""

    product_id: UUID = Field(...)
    quantity: int = Field(..., ge=1)
    sale_price_som: int = Field(
        ..., ge=0, validation_alias=AliasChoices("sale_price_som", "sale_price")
    )
    courier_fee_som: int = Field(
        ..., ge=0, validation_alias=AliasChoices("courier_fee_som", "courier_fee")
    )
    courier_id: UUID | None = Field(None)
    customer_name: str | None = Field(None, min_length=1)
    customer_phone: str | None = Field(None, min_length=1)
    delivery_address: str = Field(..., min_length=1)
    note: str | None = Field(None)


class OrderUpdate(BaseModel):
    """Обновление заказа."""

    product_id: UUID | None = Field(None)
    courier_id: UUID | None = Field(None)
    quantity: int | None = Field(None, ge=1)
    sale_price_som: int | None = Field(
        None, ge=0, validation_alias=AliasChoices("sale_price_som", "sale_price")
    )
    courier_fee_som: int | None = Field(
        None, ge=0, validation_alias=AliasChoices("courier_fee_som", "courier_fee")
    )
    customer_name: str | None = Field(None, min_length=1)
    customer_phone: str | None = Field(None, min_length=1)
    delivery_address: str | None = Field(None, min_length=1)
    status: OrderStatus | None = Field(None)
    note: str | None = Field(None)


class OrderProductOut(BaseModel):
    """Краткая информация о товаре в заказе."""

    id: UUID = Field(...)
    title: str = Field(...)

    class Config:
        from_attributes = True
        populate_by_name = True


class OrderCourierOut(BaseModel):
    """Краткая информация о курьере в заказе."""

    id: UUID = Field(...)
    name: str = Field(...)

    class Config:
        from_attributes = True
        populate_by_name = True


class OrderOut(BaseModel):
    """Заказ для ответа."""

    id: int = Field(...)
    product_id: UUID = Field(...)
    courier_id: UUID | None = Field(None)
    product: OrderProductOut | None = Field(None)
    courier: OrderCourierOut | None = Field(None)
    quantity: int = Field(..., ge=1)
    sale_price_som: int = Field(
        ..., ge=0, validation_alias=AliasChoices("sale_price_som", "sale_price")
    )
    courier_fee_som: int = Field(
        ..., ge=0, validation_alias=AliasChoices("courier_fee_som", "courier_fee")
    )
    customer_name: str | None = Field(None)
    customer_phone: str | None = Field(None)
    delivery_address: str = Field(...)
    status: OrderStatus = Field(...)
    note: str | None = Field(None)
    net_profit_som: int | None = Field(None)
    created_at: datetime = Field(...)
    updated_at: datetime = Field(...)

    class Config:
        from_attributes = True
        populate_by_name = True


class OrderListOut(OrderOut):
    """Заказ в списке."""


class AssignRequest(BaseModel):
    """Назначение курьера."""

    courier_id: UUID = Field(...)


class StatusEntryOut(BaseModel):
    """Схема истории статусов."""

    id: UUID = Field(...)
    old_status: str | None = Field(None)
    new_status: str = Field(...)
    changed_by: UUID = Field(...)
    changed_at: datetime = Field(...)

    class Config:
        from_attributes = True
