"""Сервис маршрутов.

Весь цикл жизни маршрута: создание → активация → завершение.
КРИТИЧНО: complete_stop использует SELECT FOR UPDATE для атомарности.
"""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.order import Order
from models.route import Route
from models.user import User
from schemas.route import RouteCreate, RouteUpdate, RouteListItem, RouteOut, StopOut

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────
#  Вспомогательные функции
# ─────────────────────────────────────────────────────

def _build_stop_out(order: Order) -> StopOut:
    """Сборка StopOut из ORM-объекта Order."""
    product_title = None
    if order.product is not None:
        product_title = order.product.title
    return StopOut(
        id=order.id,
        stop_sequence=order.stop_sequence or 0,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        delivery_address=order.delivery_address,
        product_title=product_title,
        quantity=order.quantity,
        status=order.status,
        note=order.note,
    )


def _route_counters(stops: list[Order]) -> dict:
    delivered = sum(1 for s in stops if s.status == "delivered")
    failed = sum(1 for s in stops if s.status == "failed")
    return {"stops_total": len(stops), "stops_delivered": delivered, "stops_failed": failed}


async def _fetch_route(route_id: UUID, db: AsyncSession, *, lock: bool = False) -> Route:
    """Загрузить маршрут со всеми связями. Опционально с FOR UPDATE."""
    stmt = (
        select(Route)
        .options(
            selectinload(Route.courier),
            selectinload(Route.stops).selectinload(Order.product),
        )
        .where(Route.id == route_id)
    )
    if lock:
        stmt = stmt.with_for_update()
    result = await db.execute(stmt)
    route = result.scalar_one_or_none()
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    return route


def _route_to_out(route: Route) -> RouteOut:
    stops = sorted(route.stops, key=lambda s: s.stop_sequence or 0)
    counters = _route_counters(stops)
    return RouteOut(
        id=route.id,
        label=route.label,
        status=route.status,
        courier=route.courier,
        created_by=route.created_by,
        stops=[_build_stop_out(s) for s in stops],
        stops_total=counters["stops_total"],
        stops_delivered=counters["stops_delivered"],
        stops_failed=counters["stops_failed"],
        started_at=route.started_at,
        completed_at=route.completed_at,
        created_at=route.created_at,
    )


def _route_to_list_item(route: Route) -> RouteListItem:
    counters = _route_counters(route.stops)
    return RouteListItem(
        id=route.id,
        label=route.label,
        status=route.status,
        courier=route.courier,
        stops_total=counters["stops_total"],
        stops_delivered=counters["stops_delivered"],
        stops_failed=counters["stops_failed"],
        created_at=route.created_at,
        started_at=route.started_at,
        completed_at=route.completed_at,
    )


# ─────────────────────────────────────────────────────
#  CRUD
# ─────────────────────────────────────────────────────

async def create_route(data: RouteCreate, created_by: UUID, db: AsyncSession) -> RouteOut:
    """Создать маршрут из списка ID заказов.

    Validation:
    - Курьер должен существовать и быть активным.
    - Все заказы должны существовать, быть в статусе 'new' или 'assigned',
      и не принадлежать другому маршруту.
    """
    # Validate courier
    courier = await db.get(User, data.courier_id)
    if courier is None or not courier.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Courier not found or inactive")
    if courier.role != "courier":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Selected user is not a courier")

    # Validate & load orders
    orders: list[Order] = []
    for idx, order_id in enumerate(data.order_ids):
        result = await db.execute(
            select(Order).options(selectinload(Order.product)).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        if order is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order {order_id} not found",
            )
        if order.route_id is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Order {order_id} already belongs to route {order.route_id}",
            )
        if order.status not in ("new", "assigned"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Order {order_id} has status '{order.status}' — only 'new' or 'assigned' orders can be routed",
            )
        orders.append(order)

    # Create route
    route = Route(
        courier_id=data.courier_id,
        created_by=created_by,
        label=data.label,
        status="draft",
    )
    db.add(route)
    await db.flush()  # Get route.id without full commit

    # Assign orders to route with stop sequence
    for idx, order in enumerate(orders):
        order.route_id = route.id
        order.stop_sequence = idx + 1
        order.courier_id = data.courier_id
        if order.status == "new":
            order.status = "assigned"

    await db.commit()

    # Reload with relationships
    route = await _fetch_route(route.id, db)
    logger.info("Route %s created with %d stops by %s", route.id, len(orders), created_by)

    from core.websocket import manager
    await manager.broadcast({"event": "route_created", "id": str(route.id)})

    return _route_to_out(route)


async def list_routes(
    db: AsyncSession,
    route_status: str | None = None,
    courier_id: UUID | None = None,
) -> list[RouteListItem]:
    """Список маршрутов с фильтрацией."""
    stmt = (
        select(Route)
        .options(selectinload(Route.courier), selectinload(Route.stops))
        .order_by(Route.created_at.desc())
    )
    if route_status:
        stmt = stmt.where(Route.status == route_status)
    if courier_id:
        stmt = stmt.where(Route.courier_id == courier_id)

    result = await db.execute(stmt)
    routes = list(result.scalars().all())
    return [_route_to_list_item(r) for r in routes]


async def get_route(route_id: UUID, db: AsyncSession) -> RouteOut:
    """Получить полный маршрут по ID."""
    route = await _fetch_route(route_id, db)
    return _route_to_out(route)


async def update_route(route_id: UUID, data: RouteUpdate, db: AsyncSession) -> RouteOut:
    """Обновить маршрут (только в статусе 'draft')."""
    route = await _fetch_route(route_id, db)
    if route.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only draft routes can be updated",
        )

    if data.label is not None:
        route.label = data.label
    if data.courier_id is not None:
        courier = await db.get(User, data.courier_id)
        if courier is None or courier.role != "courier":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Courier not found")
        route.courier_id = data.courier_id
        # Re-assign all stops to new courier
        for stop in route.stops:
            stop.courier_id = data.courier_id

    await db.commit()
    route = await _fetch_route(route_id, db)

    from core.websocket import manager
    await manager.broadcast({"event": "route_updated", "id": str(route.id)})

    return _route_to_out(route)


async def cancel_route(route_id: UUID, db: AsyncSession) -> None:
    """Отменить маршрут (только draft). Возвращает заказы в статус 'new'."""
    route = await _fetch_route(route_id, db)
    if route.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only draft routes can be deleted/cancelled",
        )

    for stop in route.stops:
        stop.route_id = None
        stop.stop_sequence = None
        stop.status = "new"
        stop.courier_id = None

    await db.delete(route)
    await db.commit()
    logger.info("Route %s cancelled and deleted; orders returned to 'new'", route_id)

    from core.websocket import manager
    await manager.broadcast({"event": "route_cancelled", "id": str(route_id)})


# ─────────────────────────────────────────────────────
#  Route lifecycle: start / complete stop
# ─────────────────────────────────────────────────────

async def start_route(route_id: UUID, db: AsyncSession) -> RouteOut:
    """Активировать маршрут (draft → active).

    - Первая остановка переходит в in_transit.
    - Курьер получает Telegram-уведомление (вызывается из роутера).
    """
    import datetime as dt

    route = await _fetch_route(route_id, db, lock=True)
    if route.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Route is '{route.status}' — only 'draft' routes can be started",
        )

    stops = sorted(route.stops, key=lambda s: s.stop_sequence or 0)
    if not stops:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Route has no stops")

    route.status = "active"
    route.started_at = dt.datetime.now(dt.timezone.utc)

    # First stop → in_transit
    first_stop = stops[0]
    first_stop.status = "in_transit"

    await db.commit()
    route = await _fetch_route(route_id, db)
    logger.info("Route %s started; stop %d is now in_transit", route_id, first_stop.id)

    from core.websocket import manager
    await manager.broadcast({"event": "route_started", "id": str(route_id)})

    return _route_to_out(route)


async def complete_stop(
    route_id: UUID,
    stop_id: int,
    result_status: str,  # "delivered" | "failed"
    failure_reason: str | None,
    courier_tg_id: int,
    db: AsyncSession,
) -> RouteOut:
    """Завершить текущую остановку (in_transit → delivered/failed).

    Атомарная транзакция:
    1. Проверить, что курьер соответствует маршруту.
    2. Текущий стоп → delivered/failed.
    3. Следующий стоп → in_transit.
    4. Если последний → route → completed.
    """
    import datetime as dt

    # Lock the route row to prevent concurrent mutation
    route = await _fetch_route(route_id, db, lock=True)

    if route.status != "active":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Route is '{route.status}' — can only complete stops on active routes",
        )

    # Verify courier
    if route.courier is None or route.courier.tg_id != courier_tg_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this route")

    stops = sorted(route.stops, key=lambda s: s.stop_sequence or 0)

    # Find the target stop
    target_stop = next((s for s in stops if s.id == stop_id), None)
    if target_stop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stop not found in this route")

    if target_stop.status != "in_transit":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Stop {stop_id} is '{target_stop.status}' — only 'in_transit' stops can be completed",
        )

    if result_status not in ("delivered", "failed"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="result must be 'delivered' or 'failed'")

    # Complete current stop
    target_stop.status = result_status
    if failure_reason and result_status == "failed":
        target_stop.note = failure_reason

    # Advance to next stop
    current_seq = target_stop.stop_sequence or 0
    next_stops = [s for s in stops if (s.stop_sequence or 0) > current_seq and s.status == "assigned"]

    if next_stops:
        next_stop = min(next_stops, key=lambda s: s.stop_sequence or 0)
        next_stop.status = "in_transit"
    else:
        # No more pending stops → complete the route
        route.status = "completed"
        route.completed_at = dt.datetime.now(dt.timezone.utc)
        logger.info("Route %s completed", route_id)

    await db.commit()
    route = await _fetch_route(route_id, db)

    from core.websocket import manager
    await manager.broadcast({"event": "route_stop_completed", "id": str(route_id), "stop_id": stop_id})

    return _route_to_out(route)
