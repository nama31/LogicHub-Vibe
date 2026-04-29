"""Роутер пользователей."""

from fastapi import APIRouter, Depends
from typing import List
from schemas.user import UserOut, UserCreate, UserUpdate
from uuid import UUID

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=List[UserOut])
async def get_users() -> List[UserOut]:
    """Получение списка пользователей (admin)."""
    # TODO: implement
    pass

@router.post("", response_model=UserOut)
async def create_user(user: UserCreate) -> UserOut:
    """Создание пользователя (admin)."""
    # TODO: implement
    pass

@router.patch("/{id}", response_model=UserOut)
async def update_user(id: UUID, user: UserUpdate) -> UserOut:
    """Обновление пользователя (admin)."""
    # TODO: implement
    pass
