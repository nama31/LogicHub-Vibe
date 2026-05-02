"""Роутер маршрутов."""

from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, status as http_status
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import get_db, require_admin, require_bot_secret
from models.user import User
from schemas.route import (
    RouteCreate,
    RouteListItem,
    RouteListResponse,
    RouteOut,
    RouteUpdate,
    StopCompleteRequest,
)
from services import route_service
from services.notification_service import notify_route_started

# ─── Admin-facing routes ───────────────────────────────────────────────────────
router = APIRouter(prefix="/routes", tags=["routes"])

# Bot-internal endpoint has its own prefix
bot_router = APIRouter(prefix="/bot/routes", tags=["bot-routes"])


@router.post("", response_model=RouteOut, status_code=http_status.HTTP_201_CREATED)
async def create_route(
    data: RouteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> RouteOut:
    """Создать маршрут из списка заказов (admin).

    Все заказы должны быть в статусе 'new' или 'assigned' и не принадлежать другому маршруту.
    """
    return await route_service.create_route(data, current_user.id, db)


@router.get("", response_model=RouteListResponse)
async def list_routes(
    route_status: str | None = None,
    courier_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> RouteListResponse:
    """Список маршрутов с фильтрацией (admin)."""
    routes = await route_service.list_routes(db, route_status=route_status, courier_id=courier_id)
    return RouteListResponse(total=len(routes), routes=routes)


@router.get("/{route_id}", response_model=RouteOut)
async def get_route(
    route_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> RouteOut:
    """Полный маршрут со всеми остановками (admin)."""
    return await route_service.get_route(route_id, db)


@router.patch("/{route_id}", response_model=RouteOut)
async def update_route(
    route_id: UUID,
    data: RouteUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> RouteOut:
    """Изменить метку или курьера маршрута (только в статусе 'draft')."""
    return await route_service.update_route(route_id, data, db)


@router.delete("/{route_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def cancel_route(
    route_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> None:
    """Отменить и удалить черновик маршрута (только 'draft'). Заказы возвращаются в 'new'."""
    await route_service.cancel_route(route_id, db)


@router.post("/{route_id}/start", response_model=RouteOut)
async def start_route(
    route_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
) -> RouteOut:
    """Активировать маршрут (draft → active). Отправляет уведомление курьеру в Telegram."""
    route_out = await route_service.start_route(route_id, db)
    # Fire-and-forget Telegram notification to the courier
    background_tasks.add_task(notify_route_started, route_out)
    return route_out


# ─── Bot-internal endpoint ─────────────────────────────────────────────────────

@bot_router.patch("/{route_id}/stop/{stop_id}/complete", response_model=RouteOut)
async def complete_stop(
    route_id: UUID,
    stop_id: int,
    data: StopCompleteRequest,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(require_bot_secret),
) -> RouteOut:
    """Завершить текущую остановку (bot internal).

    Автоматически переводит следующую остановку в in_transit.
    Если это последняя остановка — маршрут завершается.
    """
    return await route_service.complete_stop(
        route_id=route_id,
        stop_id=stop_id,
        result_status=data.result,
        failure_reason=data.failure_reason,
        courier_tg_id=data.tg_id,
        db=db,
    )


@bot_router.get("/active", response_model=RouteOut | None)
async def get_active_route_for_bot(
    tg_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(require_bot_secret),
) -> RouteOut | None:
    """Получить активный маршрут курьера для Telegram-бота."""

    routes = await route_service.list_routes(db, route_status="active")
    for route_item in routes:
        courier = route_item.courier
        if courier is not None and courier.tg_id == tg_id:
            return await route_service.get_route(route_item.id, db)
    return None


@bot_router.get("/by-id/{route_id}", response_model=RouteOut)
async def get_route_for_bot(
    route_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(require_bot_secret),
) -> RouteOut:
    """Получить маршрут по ID для Telegram-бота."""

    return await route_service.get_route(route_id, db)
