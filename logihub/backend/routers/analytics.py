"""Роутер аналитики."""

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
from redis.exceptions import RedisError

from core.config import settings
from core.dependencies import get_db, require_admin
from services.analytics_service import (
    get_profit as get_profit_service,
    get_summary as get_summary_service,
    get_courier_analytics as get_courier_analytics_service,
    get_product_analytics as get_product_analytics_service,
    get_trend_analytics as get_trend_analytics_service,
    get_failed_analytics as get_failed_analytics_service,
)
from schemas.analytics import (
    SummaryOut,
    ProfitOut,
    CourierAnalyticsOut,
    ProductAnalyticsOut,
    TrendAnalyticsOut,
    FailedAnalyticsOut,
)
from models.user import User

router = APIRouter(prefix="/analytics", tags=["analytics"])
logger = logging.getLogger(__name__)

redis_client = redis.from_url(settings.redis_url, decode_responses=True)

@router.get("/summary", response_model=SummaryOut)
async def get_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> SummaryOut:
    """Сводная аналитика (admin)."""

    cache_key = f"analytics:summary:{current_user.id}"
    try:
        cached = await redis_client.get(cache_key)
    except RedisError as exc:
        logger.warning("Redis analytics summary cache read failed: %s", exc)
        cached = None

    if cached:
        return SummaryOut.model_validate_json(cached)

    summary = await get_summary_service(db, current_user=current_user)
    
    try:
        await redis_client.set(cache_key, summary.model_dump_json(), ex=60)
    except RedisError as exc:
        logger.warning("Redis analytics summary cache write failed: %s", exc)
    
    return summary

@router.get("/profit", response_model=ProfitOut)
async def get_profit(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> ProfitOut:
    """Аналитика прибыли (admin)."""

    return await get_profit_service(db, current_user=current_user)

@router.get("/couriers", response_model=CourierAnalyticsOut)
async def get_courier_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> CourierAnalyticsOut:
    """Аналитика по курьерам (admin)."""
    return await get_courier_analytics_service(db, current_user=current_user)

@router.get("/products", response_model=ProductAnalyticsOut)
async def get_product_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> ProductAnalyticsOut:
    """Маржинальность товаров (admin)."""
    return await get_product_analytics_service(db, current_user=current_user)

@router.get("/trends", response_model=TrendAnalyticsOut)
async def get_trend_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> TrendAnalyticsOut:
    """Тренды за 30 дней (admin)."""
    return await get_trend_analytics_service(db, current_user=current_user)

@router.get("/failed", response_model=FailedAnalyticsOut)
async def get_failed_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> FailedAnalyticsOut:
    """Причины неудачных доставок (admin)."""
    return await get_failed_analytics_service(db, current_user=current_user)
