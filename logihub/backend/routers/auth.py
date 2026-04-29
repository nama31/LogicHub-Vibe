"""Роутер аутентификации."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import get_current_user, get_db
from schemas.auth import LoginRequest, TokenResponse
from schemas.user import UserOut
from models.user import User
from services.auth_service import get_me as get_me_service, login as login_service

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Авторизация пользователя."""

    return await login_service(request, db)

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)) -> UserOut:
    """Получение текущего пользователя (требует JWT)."""

    return await get_me_service(current_user)
