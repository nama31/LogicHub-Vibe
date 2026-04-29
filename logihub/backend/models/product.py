"""Модель товара."""

from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base

class Product(Base):
    """Модель товара БД."""
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    purchase_price = Column(Integer, nullable=False)  # тыйын
    stock_quantity = Column(Integer, default=0)
    unit = Column(String, default='шт')
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
