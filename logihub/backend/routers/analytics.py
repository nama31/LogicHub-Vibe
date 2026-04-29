"""Роутер аналитики."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import get_db, require_admin
from schemas.analytics import SummaryOut, ProfitOut
from services.analytics_service import get_profit as get_profit_service, get_summary as get_summary_service

router = APIRouter(prefix="/analytics", tags=["analytics"], dependencies=[Depends(require_admin)])

@router.get("/summary", response_model=SummaryOut)
async def get_summary(db: AsyncSession = Depends(get_db)) -> SummaryOut:
    """Сводная аналитика (admin)."""

    return await get_summary_service(db)

@router.get("/profit", response_model=ProfitOut)
async def get_profit(db: AsyncSession = Depends(get_db)) -> ProfitOut:
    """Аналитика прибыли (admin)."""

    return await get_profit_service(db)
