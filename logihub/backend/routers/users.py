"""Роутер пользователей."""

from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import get_db, require_admin, require_admin_or_bot_secret
from schemas.user import UserOut, UserCreate, UserUpdate
from uuid import UUID
from services.user_service import create_user as create_user_service, get_users as get_users_service, update_user as update_user_service, delete_user as delete_user_service

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=List[UserOut])
async def get_users(
    db: AsyncSession = Depends(get_db),
    _auth: UserOut | None = Depends(require_admin_or_bot_secret),
) -> List[UserOut]:
    """Получение списка пользователей (admin)."""

    return await get_users_service(db)

@router.post("", response_model=UserOut)
async def create_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_db),
    _admin: UserOut | None = Depends(require_admin),
) -> UserOut:
    """Создание пользователя (admin)."""

    return await create_user_service(user, db)

@router.patch("/{id}", response_model=UserOut)
async def update_user(
    id: UUID,
    user: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: UserOut | None = Depends(require_admin),
) -> UserOut:
    """Обновление пользователя (admin)."""

    return await update_user_service(id, user, db)

@router.delete("/{id}", status_code=204)
async def delete_user(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: UserOut | None = Depends(require_admin),
) -> None:
    """Удаление пользователя (admin)."""

    await delete_user_service(id, db)
