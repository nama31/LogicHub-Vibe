"""Сервис пользователей."""

from typing import List
from schemas.user import UserCreate, UserUpdate
from models.user import User
from uuid import UUID

async def get_users() -> List[User]:
    """Получить пользователей."""
    # TODO: implement
    pass

async def create_user(data: UserCreate) -> User:
    """Создать пользователя."""
    # TODO: implement
    pass

async def update_user(id: UUID, data: UserUpdate) -> User:
    """Обновить пользователя."""
    # TODO: implement
    pass
