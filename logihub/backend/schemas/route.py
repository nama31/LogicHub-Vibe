"""Схемы маршрута."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

RouteStatus = Literal["pending", "draft", "active", "completed", "cancelled"]


# ─────────────────────────────────────────────────────
#  Nested schemas used inside RouteOut
# ─────────────────────────────────────────────────────

class RouteCourierOut(BaseModel):
    """Краткая информация о курьере в маршруте."""

    id: UUID = Field(...)
    name: str = Field(...)
    tg_id: int | None = Field(None)
    phone: str | None = Field(None)

    class Config:
        from_attributes = True
        populate_by_name = True


class StopOut(BaseModel):
    """Одна остановка маршрута (снимок заказа).

    Используется внутри RouteOut.stops для отображения
    карточки остановки курьеру и администратору.
    """

    id: int = Field(...)
    stop_sequence: int = Field(...)
    customer_name: str | None = Field(None)
    customer_phone: str | None = Field(None)
    delivery_address: str = Field(...)
    product_title: str | None = Field(None)
    quantity: int = Field(...)
    status: str = Field(...)
    note: str | None = Field(None)

    class Config:
        from_attributes = True
        populate_by_name = True


# ─────────────────────────────────────────────────────
#  Request schemas
# ─────────────────────────────────────────────────────

class RouteCreate(BaseModel):
    """Создание нового маршрута.

    Администратор передаёт список order_id и назначает курьера.
    Все заказы должны существовать, не принадлежать другому маршруту,
    и иметь статус 'new' или 'assigned'.
    """

    courier_id: UUID = Field(..., description="UUID курьера")
    label: str | None = Field(None, max_length=200, description="Название рейса, например 'Утренний рейс'")
    order_ids: list[int] = Field(..., min_length=1, description="Список ID заказов в порядке остановок")


class RouteUpdate(BaseModel):
    """Частичное обновление маршрута (только в статусе 'draft')."""

    label: str | None = Field(None, max_length=200)
    courier_id: UUID | None = Field(None)


class StopCompleteRequest(BaseModel):
    """Запрос от бота для завершения одной остановки."""

    tg_id: int = Field(..., description="Telegram ID курьера для верификации")
    result: Literal["delivered", "failed"] = Field(..., description="Результат доставки")
    failure_reason: str | None = Field(None, max_length=300, description="Причина неудачи (если result='failed')")


# ─────────────────────────────────────────────────────
#  Response schemas
# ─────────────────────────────────────────────────────

class RouteOut(BaseModel):
    """Полный маршрут для ответа администратору."""

    id: UUID = Field(...)
    label: str | None = Field(None)
    status: RouteStatus = Field(...)
    courier: RouteCourierOut | None = Field(None)
    created_by: UUID = Field(...)
    stops: list[StopOut] = Field(default_factory=list)
    stops_total: int = Field(0)
    stops_delivered: int = Field(0)
    stops_failed: int = Field(0)
    started_at: datetime | None = Field(None)
    completed_at: datetime | None = Field(None)
    created_at: datetime = Field(...)

    class Config:
        from_attributes = True
        populate_by_name = True


class RouteListItem(BaseModel):
    """Маршрут в списке (без полного списка остановок)."""

    id: UUID = Field(...)
    label: str | None = Field(None)
    status: RouteStatus = Field(...)
    courier: RouteCourierOut | None = Field(None)
    stops_total: int = Field(0)
    stops_delivered: int = Field(0)
    stops_failed: int = Field(0)
    created_at: datetime = Field(...)
    started_at: datetime | None = Field(None)
    completed_at: datetime | None = Field(None)

    class Config:
        from_attributes = True
        populate_by_name = True


class RouteListResponse(BaseModel):
    """Список маршрутов."""

    total: int = Field(...)
    routes: list[RouteListItem] = Field(...)
