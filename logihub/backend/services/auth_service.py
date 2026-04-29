"""Сервис аутентификации."""

from schemas.auth import LoginRequest, TokenResponse
from models.user import User

async def login(request: LoginRequest) -> TokenResponse:
    """Логика авторизации."""
    # TODO: implement
    pass

async def get_me(user: User) -> User:
    """Логика получения профиля."""
    # TODO: implement
    pass
