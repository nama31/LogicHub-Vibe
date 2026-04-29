"""Сервис аналитики."""

from datetime import UTC, date, datetime, timedelta

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.order import Order
from models.product import Product
from schemas.analytics import SummaryOut, ProfitOut

async def get_summary(db: AsyncSession) -> SummaryOut:
    """Получить сводку."""

    today = datetime.now(UTC).date()
    week_start = today - timedelta(days=today.weekday())
    tomorrow = today + timedelta(days=1)

    today_summary = await _get_period_summary(db, today, tomorrow)
    week_summary = await _get_period_summary(db, week_start, tomorrow)
    open_orders = await _get_open_orders(db)
    stock_alerts = await _get_stock_alerts(db)

    return SummaryOut(
        today=today_summary,
        this_week=week_summary,
        stock_alerts=stock_alerts,
        open_orders=open_orders,
    )

async def get_profit(db: AsyncSession) -> ProfitOut:
    """Получить аналитику прибыли."""

    result = await db.execute(
        select(
            func.min(func.date(Order.created_at)).label("min_date"),
            func.max(func.date(Order.created_at)).label("max_date"),
        )
    )
    row = result.one()
    min_date = row.min_date
    max_date = row.max_date

    if min_date is None or max_date is None:
        today = datetime.now(UTC).date()
        return ProfitOut(
            period={"from": today, "to": today},
            total_profit_som=0,
            breakdown=[],
        )

    day_label = func.date(Order.created_at).label("date")
    statement = (
        select(
            day_label,
            func.count(Order.id).label("orders"),
            func.coalesce(func.sum(Order.sale_price * Order.quantity), 0).label("revenue_som"),
            func.coalesce(func.sum(Product.purchase_price * Order.quantity), 0).label("cost_som"),
            func.coalesce(func.sum(Order.courier_fee), 0).label("courier_fees_som"),
            func.coalesce(
                func.sum((Order.sale_price - Product.purchase_price) * Order.quantity - Order.courier_fee),
                0,
            ).label("profit_som"),
        )
        .select_from(Order)
        .join(Product, Product.id == Order.product_id)
        .where(func.date(Order.created_at).between(min_date, max_date))
        .group_by(day_label)
        .order_by(day_label)
    )

    result = await db.execute(statement)
    rows = result.all()

    breakdown = [
        {
            "date": row.date,
            "orders": int(row.orders or 0),
            "revenue_som": int(row.revenue_som or 0),
            "cost_som": int(row.cost_som or 0),
            "courier_fees_som": int(row.courier_fees_som or 0),
            "profit_som": int(row.profit_som or 0),
        }
        for row in rows
    ]

    total_profit_som = sum(item["profit_som"] for item in breakdown)

    return ProfitOut(
        period={"from": min_date, "to": max_date},
        total_profit_som=total_profit_som,
        breakdown=breakdown,
    )


async def _get_period_summary(db: AsyncSession, start_date: date, end_date: date) -> "SummaryPeriodOut":
    from schemas.analytics import SummaryPeriodOut

    statement = (
        select(
            func.count(Order.id).label("orders_created"),
            func.coalesce(
                func.sum(case((Order.status == "delivered", 1), else_=0)),
                0,
            ).label("orders_delivered"),
            func.coalesce(
                func.sum((Order.sale_price - Product.purchase_price) * Order.quantity - Order.courier_fee),
                0,
            ).label("net_profit_som"),
        )
        .select_from(Order)
        .join(Product, Product.id == Order.product_id)
        .where(func.date(Order.created_at) >= start_date, func.date(Order.created_at) < end_date)
    )

    result = await db.execute(statement)
    row = result.one()

    return SummaryPeriodOut(
        orders_created=int(row.orders_created or 0),
        orders_delivered=int(row.orders_delivered or 0),
        net_profit_som=int(row.net_profit_som or 0),
    )


async def _get_open_orders(db: AsyncSession):
    from schemas.analytics import OpenOrderCountsOut

    statement = (
        select(Order.status, func.count(Order.id).label("count"))
        .where(Order.status.in_(["new", "assigned", "in_transit"]))
        .group_by(Order.status)
    )
    result = await db.execute(statement)
    counts = {row.status: int(row.count or 0) for row in result.all()}

    return OpenOrderCountsOut(
        new=counts.get("new", 0),
        assigned=counts.get("assigned", 0),
        in_transit=counts.get("in_transit", 0),
    )


async def _get_stock_alerts(db: AsyncSession):
    from schemas.analytics import StockAlertOut

    result = await db.execute(
        select(Product.id, Product.title, Product.stock_quantity)
        .where(Product.stock_quantity < 5)
        .order_by(Product.stock_quantity.asc(), Product.title.asc())
    )

    return [
        StockAlertOut(product_id=str(row.id), title=row.title, stock_quantity=int(row.stock_quantity))
        for row in result.all()
    ]
