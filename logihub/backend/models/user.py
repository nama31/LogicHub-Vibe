"""Модель пользователя."""

from sqlalchemy import Column, String, Boolean, DateTime, BigInteger
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base

class User(Base):
    """Модель пользователя БД."""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'admin' | 'courier'
    tg_id = Column(BigInteger, unique=True, nullable=True)
    password_hash = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=False)
