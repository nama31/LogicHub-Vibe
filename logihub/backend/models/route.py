"""Модель маршрута."""

import datetime as dt
import uuid

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base

ROUTE_STATUSES = ["draft", "active", "completed", "cancelled"]


class Route(Base):
    """Модель маршрута БД.

    Маршрут — именованная, последовательная коллекция заказов,
    назначенная одному курьеру для одного рейса.
    """

    __tablename__ = "routes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    courier_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    label: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(
        SQLEnum(*ROUTE_STATUSES, name="route_status"),
        nullable=False,
        server_default="draft",
    )
    started_at: Mapped[dt.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[dt.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    courier = relationship("User", back_populates="routes_as_courier", foreign_keys=[courier_id])
    creator = relationship("User", back_populates="routes_created", foreign_keys=[created_by])
    stops = relationship(
        "Order",
        back_populates="route",
        foreign_keys="Order.route_id",
        order_by="Order.stop_sequence",
    )
