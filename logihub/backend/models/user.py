"""Модель пользователя."""

import datetime as dt
import uuid

from sqlalchemy import BigInteger, Boolean, DateTime, Enum as SQLEnum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from constants.user_roles import USER_ROLES

from .base import Base


class User(Base):
    """Модель пользователя БД."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(SQLEnum(*USER_ROLES, name="user_role"), nullable=False)
    tg_id: Mapped[int | None] = mapped_column(BigInteger, unique=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    courier_orders = relationship("Order", back_populates="courier", foreign_keys="Order.courier_id")
    status_changes = relationship("OrderStatusLog", back_populates="changed_by_user", foreign_keys="OrderStatusLog.changed_by")
