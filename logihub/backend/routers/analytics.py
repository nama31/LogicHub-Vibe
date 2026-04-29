"""Роутер аналитики."""

from fastapi import APIRouter, Depends
from schemas.analytics import SummaryOut, ProfitOut

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/summary", response_model=SummaryOut)
async def get_summary() -> SummaryOut:
    """Сводная аналитика (admin)."""
    # TODO: implement
    pass

@router.get("/profit", response_model=ProfitOut)
async def get_profit() -> ProfitOut:
    """Аналитика прибыли (admin)."""
    # TODO: implement
    pass
