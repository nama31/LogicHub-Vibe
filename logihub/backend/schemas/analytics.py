"""Схемы аналитики."""

from datetime import date as Date

from pydantic import BaseModel, Field


class SummaryPeriodOut(BaseModel):
    """Сводка за период."""

    orders_created: int = Field(..., ge=0)
    orders_delivered: int = Field(..., ge=0)
    net_profit_som: int = Field(...)


class OpenOrderCountsOut(BaseModel):
    """Счетчики открытых заказов."""

    new: int = Field(..., ge=0)
    assigned: int = Field(..., ge=0)
    in_transit: int = Field(..., ge=0)


class StockAlertOut(BaseModel):
    """Товар с низким остатком."""

    product_id: str = Field(...)
    title: str = Field(...)
    stock_quantity: int = Field(..., ge=0)


class SummaryOut(BaseModel):
    """Сводка аналитики."""

    today: SummaryPeriodOut = Field(...)
    this_week: SummaryPeriodOut = Field(...)
    stock_alerts: list[StockAlertOut] = Field(default_factory=list)
    open_orders: OpenOrderCountsOut = Field(...)


class ProfitPeriodOut(BaseModel):
    """Период отчета по прибыли."""

    from_: Date = Field(..., alias="from")
    to: Date = Field(...)

    class Config:
        populate_by_name = True


class ProfitBreakdownItemOut(BaseModel):
    """Прибыль по конкретному дню."""

    date: Date = Field(...)
    orders: int = Field(..., ge=0)
    revenue_som: int = Field(...)
    cost_som: int = Field(...)
    courier_fees_som: int = Field(...)
    profit_som: int = Field(...)


class ProfitOut(BaseModel):
    """Ответ прибыли."""

    period: ProfitPeriodOut = Field(...)
    total_profit_som: int = Field(...)
    breakdown: list[ProfitBreakdownItemOut] = Field(default_factory=list)
