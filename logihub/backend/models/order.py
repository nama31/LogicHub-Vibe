"""Модель заказа."""

import datetime as dt
import uuid

from sqlalchemy import DateTime, Enum as SQLEnum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from constants.order_status import ORDER_STATUSES

from .base import Base


class Order(Base):
    """Модель заказа БД."""

    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    courier_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    sale_price: Mapped[int] = mapped_column(Integer, nullable=False)  # tiyins
    courier_fee: Mapped[int] = mapped_column(Integer, nullable=False)  # tiyins
    customer_name: Mapped[str | None] = mapped_column(String, nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    delivery_address: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(SQLEnum(*ORDER_STATUSES, name="order_status"), nullable=False, server_default="new")
    note: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    product = relationship("Product", back_populates="orders")
    courier = relationship("User", back_populates="courier_orders", foreign_keys=[courier_id])
    status_logs = relationship("OrderStatusLog", back_populates="order")
