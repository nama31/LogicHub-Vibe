"""Зависимости FastAPI (DI)."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from models.user import User

async def get_db() -> AsyncSession:
    """Получение сессии БД."""
    # TODO: implement
    pass

async def get_current_user(token: str = Depends(..., description="OAuth2 Password Bearer")) -> User:
    """Получение текущего пользователя по JWT."""
    # TODO: implement
    pass

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Проверка прав админа."""
    # TODO: implement
    pass

async def require_bot_secret(x_bot_secret: str = Depends(..., description="Header")) -> bool:
    """Проверка X-Bot-Secret header."""
    # TODO: implement
    pass
