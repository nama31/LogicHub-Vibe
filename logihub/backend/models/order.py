"""Модель заказа."""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base

class Order(Base):
    """Модель заказа БД."""
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    courier_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    quantity = Column(Integer, nullable=False)
    sale_price = Column(Integer, nullable=False)  # тыйын
    courier_fee = Column(Integer, default=0)  # тыйын
    customer_name = Column(String, nullable=True)
    customer_phone = Column(String, nullable=True)
    delivery_address = Column(String, nullable=False)
    status = Column(String, default='new')
    note = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
