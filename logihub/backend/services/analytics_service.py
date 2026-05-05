"""Сервис аналитики."""

from datetime import UTC, date, datetime, timedelta

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from constants.price import tiyins_to_som
from models.order import Order
from models.product import Product
from schemas.analytics import SummaryOut, ProfitOut


def _date_start(day: date) -> datetime:
    return datetime.combine(day, datetime.min.time(), tzinfo=UTC)


def _date_end(day: date) -> datetime:
    return _date_start(day + timedelta(days=1))

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

async def get_profit(db: AsyncSession, from_date: date | None = None, to_date: date | None = None) -> ProfitOut:
    """Получить аналитику прибыли."""

    if not from_date or not to_date:
        result = await db.execute(
            select(
                func.min(func.date(Order.created_at)).label("min_date"),
                func.max(func.date(Order.created_at)).label("max_date"),
            )
        )
        row = result.one()
        from_date = from_date or row.min_date
        to_date = to_date or row.max_date

    if from_date is None or to_date is None:
        today = datetime.now(UTC).date()
        return ProfitOut(
            period={"from": today, "to": today},
            total_profit_som=0,
            breakdown=[],
        )

    start_dt = _date_start(from_date)
    end_dt = _date_end(to_date)
    day_label = func.date(Order.created_at).label("date")
    statement = (
        select(
            day_label,
            func.sum(case((Order.status == "delivered", 1), else_=0)).label("orders"),
            func.coalesce(
                func.sum(case((Order.status == "delivered", Order.sale_price * Order.quantity), else_=0)),
                0,
            ).label("revenue_som"),
            func.coalesce(
                func.sum(case((Order.status == "delivered", Product.purchase_price * Order.quantity), else_=0)),
                0,
            ).label("cost_som"),
            func.coalesce(
                func.sum(case((Order.status == "delivered", Order.courier_fee), else_=0)),
                0,
            ).label("courier_fees_som"),
            func.coalesce(
                func.sum(case((Order.status == "delivered", (Order.sale_price - Product.purchase_price) * Order.quantity - Order.courier_fee), else_=0)),
                0,
            ).label("profit_som"),
        )
        .select_from(Order)
        .join(Product, Product.id == Order.product_id)
        .where(Order.created_at >= start_dt, Order.created_at < end_dt)
        .group_by(day_label)
        .order_by(day_label)
    )

    result = await db.execute(statement)
    rows = result.all()

    breakdown = [
        {
            "date": row.date,
            "orders": int(row.orders or 0),
            "revenue_som": tiyins_to_som(int(row.revenue_som or 0)),
            "cost_som": tiyins_to_som(int(row.cost_som or 0)),
            "courier_fees_som": tiyins_to_som(int(row.courier_fees_som or 0)),
            "profit_som": tiyins_to_som(int(row.profit_som or 0)),
        }
        for row in rows
    ]

    total_profit_som = sum(item["profit_som"] for item in breakdown)

    return ProfitOut(
        period={"from": from_date, "to": to_date},
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
                func.sum(case((Order.status == "delivered", (Order.sale_price - Product.purchase_price) * Order.quantity - Order.courier_fee), else_=0)),
                0,
            ).label("net_profit_som"),
        )
        .select_from(Order)
        .join(Product, Product.id == Order.product_id)
        .where(Order.created_at >= _date_start(start_date), Order.created_at < _date_start(end_date))
    )

    result = await db.execute(statement)
    row = result.one()

    return SummaryPeriodOut(
        orders_created=int(row.orders_created or 0),
        orders_delivered=int(row.orders_delivered or 0),
        net_profit_som=tiyins_to_som(int(row.net_profit_som or 0)),
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

    # Получаем 5 товаров с самым низким остатком в принципе
    result = await db.execute(
        select(Product.id, Product.title, Product.stock_quantity)
        .order_by(Product.stock_quantity.asc(), Product.title.asc())
        .limit(5)
    )

    return [
        StockAlertOut(product_id=str(row.id), title=row.title, stock_quantity=int(row.stock_quantity))
        for row in result.all()
    ]


async def get_courier_analytics(db: AsyncSession) -> "CourierAnalyticsOut":
    from schemas.analytics import CourierAnalyticsOut, CourierStatOut
    from models.user import User
    from models.route import Route

    route_counts = (
        select(
            Route.courier_id.label("courier_id"),
            func.count(Route.id).label("routes_count"),
        )
        .group_by(Route.courier_id)
        .subquery()
    )
    order_counts = (
        select(
            Order.courier_id.label("courier_id"),
            func.count(Order.id).label("stops_total"),
            func.coalesce(
                func.sum(case((Order.status == "delivered", 1), else_=0)),
                0,
            ).label("stops_delivered"),
            func.coalesce(
                func.sum(case((Order.status == "failed", 1), else_=0)),
                0,
            ).label("stops_failed"),
            func.coalesce(
                func.sum(case((Order.status == "delivered", Order.courier_fee), else_=0)),
                0,
            ).label("total_fee_som"),
        )
        .group_by(Order.courier_id)
        .subquery()
    )
    statement = (
        select(
            User.id,
            User.name,
            func.coalesce(route_counts.c.routes_count, 0).label("routes_count"),
            func.coalesce(order_counts.c.stops_total, 0).label("stops_total"),
            func.coalesce(order_counts.c.stops_delivered, 0).label("stops_delivered"),
            func.coalesce(order_counts.c.stops_failed, 0).label("stops_failed"),
            func.coalesce(order_counts.c.total_fee_som, 0).label("total_fee_som"),
        )
        .select_from(User)
        .outerjoin(route_counts, route_counts.c.courier_id == User.id)
        .outerjoin(order_counts, order_counts.c.courier_id == User.id)
        .where(User.role == "courier")
        .order_by(func.coalesce(route_counts.c.routes_count, 0).desc())
    )

    result = await db.execute(statement)
    
    couriers = []
    for row in result.all():
        couriers.append(
            CourierStatOut(
                courier_id=str(row.id),
                name=row.name,
                routes_count=int(row.routes_count or 0),
                stops_total=int(row.stops_total or 0),
                stops_delivered=int(row.stops_delivered or 0),
                stops_failed=int(row.stops_failed or 0),
                total_fee_som=tiyins_to_som(int(row.total_fee_som or 0)),
            )
        )

    return CourierAnalyticsOut(couriers=couriers)


async def get_product_analytics(db: AsyncSession) -> "ProductAnalyticsOut":
    from schemas.analytics import ProductAnalyticsOut, ProductMarginOut

    statement = (
        select(
            Product.id,
            Product.title,
            func.sum(case((Order.status == "delivered", Order.quantity), else_=0)).label("total_sold"),
            func.sum(case((Order.status == "delivered", Order.sale_price * Order.quantity), else_=0)).label("revenue_som"),
            func.sum(case((Order.status == "delivered", Product.purchase_price * Order.quantity), else_=0)).label("cost_som"),
            func.sum(case((Order.status == "delivered", (Order.sale_price - Product.purchase_price) * Order.quantity - Order.courier_fee), else_=0)).label("profit_som"),
        )
        .select_from(Product)
        .outerjoin(Order, Order.product_id == Product.id)
        .group_by(Product.id)
        .order_by(func.sum(case((Order.status == "delivered", Order.quantity), else_=0)).desc())
    )

    result = await db.execute(statement)

    products = []
    for row in result.all():
        rev = int(row.revenue_som or 0)
        cost = int(row.cost_som or 0)
        prof = int(row.profit_som or 0)
        margin = 0.0
        if rev > 0:
            margin = (prof / rev) * 100.0

        products.append(
            ProductMarginOut(
                product_id=str(row.id),
                title=row.title,
                total_sold=int(row.total_sold or 0),
                revenue_som=tiyins_to_som(rev),
                cost_som=tiyins_to_som(cost),
                profit_som=tiyins_to_som(prof),
                margin_percentage=round(margin, 2),
            )
        )

    return ProductAnalyticsOut(products=products)


async def get_trend_analytics(db: AsyncSession) -> "TrendAnalyticsOut":
    from schemas.analytics import TrendAnalyticsOut, TrendItemOut

    # Последние 30 дней
    thirty_days_ago = datetime.now(UTC).date() - timedelta(days=30)
    start_dt = _date_start(thirty_days_ago)

    day_label = func.date(Order.created_at).label("date")
    statement = (
        select(
            day_label,
            func.count(Order.id).label("orders_count"),
            func.sum(case((Order.status == "delivered", (Order.sale_price - Product.purchase_price) * Order.quantity - Order.courier_fee), else_=0)).label("profit_som"),
        )
        .select_from(Order)
        .join(Product, Product.id == Order.product_id)
        .where(Order.created_at >= start_dt)
        .group_by(day_label)
        .order_by(day_label)
    )

    result = await db.execute(statement)

    trends = []
    for row in result.all():
        trends.append(
            TrendItemOut(
                date=row.date,
                orders_count=int(row.orders_count or 0),
                profit_som=tiyins_to_som(int(row.profit_som or 0)),
            )
        )

    return TrendAnalyticsOut(trends=trends)


async def get_failed_analytics(db: AsyncSession) -> "FailedAnalyticsOut":
    from schemas.analytics import FailedAnalyticsOut, FailedReasonOut

    # Анализируем поле note у заказов со статусом failed
    statement = (
        select(
            func.coalesce(Order.note, "Без причины").label("reason"),
            func.count(Order.id).label("count"),
        )
        .select_from(Order)
        .where(Order.status == "failed")
        .group_by(Order.note)
        .order_by(func.count(Order.id).desc())
    )

    result = await db.execute(statement)

    failures = []
    for row in result.all():
        failures.append(
            FailedReasonOut(
                reason=row.reason,
                count=int(row.count or 0),
            )
        )

    return FailedAnalyticsOut(failures=failures)
