"""Сервис пользователей."""

from typing import List
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_password_hash
from schemas.user import UserCreate, UserUpdate
from models.user import User
from uuid import UUID

async def get_users(db: AsyncSession) -> List[User]:
    """Получить пользователей."""

    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return list(result.scalars().all())

async def create_user(data: UserCreate, db: AsyncSession) -> User:
    """Создать пользователя."""

    if data.tg_id is not None:
        existing = await db.scalar(select(User).where(User.tg_id == data.tg_id))
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="tg_id already exists")

    user = User(
        name=data.name,
        role=data.role,
        tg_id=data.tg_id,
        phone=data.phone,
        is_active=True if data.is_active is None else data.is_active,
        password_hash=get_password_hash(data.password) if data.password else None,
    )

    db.add(user)

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Failed to create user") from exc

    await db.refresh(user)
    return user

async def update_user(id: UUID, data: UserUpdate, db: AsyncSession) -> User:
    """Обновить пользователя."""

    user = await db.get(User, id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if data.tg_id is not None and data.tg_id != user.tg_id:
        existing = await db.scalar(select(User).where(User.tg_id == data.tg_id, User.id != id))
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="tg_id already exists")

    update_data = data.model_dump(exclude_unset=True)
    password = update_data.pop("password", None)

    for field_name, value in update_data.items():
        setattr(user, field_name, value)

    if password is not None:
        user.password_hash = get_password_hash(password)

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Failed to update user") from exc

    await db.refresh(user)
    return user
