"""Схемы аналитики."""

from pydantic import BaseModel, Field
from datetime import date
from typing import List

class SummaryOut(BaseModel):
    """Сводка аналитики."""
    total_orders: int = Field(...)
    total_revenue: int = Field(...)
    total_profit: int = Field(...)

class DayBreakdown(BaseModel):
    """Прибыль по дням."""
    date: date = Field(...)
    profit: int = Field(...)

class ProfitBreakdown(BaseModel):
    """Разбивка прибыли."""
    by_days: List[DayBreakdown] = Field(...)

class ProfitOut(BaseModel):
    """Ответ прибыли."""
    total_profit: int = Field(...)
    breakdown: ProfitBreakdown = Field(...)
