"""Роутер аутентификации."""

from fastapi import APIRouter, Depends
from schemas.auth import LoginRequest, TokenResponse
from schemas.user import UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest) -> TokenResponse:
    """Авторизация пользователя."""
    # TODO: implement
    pass

@router.get("/me", response_model=UserOut)
async def get_me() -> UserOut:
    """Получение текущего пользователя (требует JWT)."""
    # TODO: implement
    pass
