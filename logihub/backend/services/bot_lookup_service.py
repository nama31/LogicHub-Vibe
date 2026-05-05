"""Shared lookup helpers for bot-facing backend endpoints."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User


async def get_active_client_by_tg_id(tg_id: int, db: AsyncSession) -> User | None:
    return await db.scalar(
        select(User).where(User.tg_id == tg_id, User.is_active.is_(True), User.role == "client")
    )


async def get_active_courier_by_tg_id(tg_id: int, db: AsyncSession) -> User | None:
    return await db.scalar(
        select(User).where(User.tg_id == tg_id, User.is_active.is_(True), User.role == "courier")
    )


async def get_first_admin_with_tg_id(db: AsyncSession) -> User | None:
    return await db.scalar(select(User).where(User.role == "admin", User.tg_id.isnot(None)))


async def get_client_tg_id_by_phone(phone: str | None, db: AsyncSession) -> int | None:
    if not phone:
        return None

    client = await db.scalar(select(User).where(User.phone == phone, User.role == "client"))
    return client.tg_id if client else None
