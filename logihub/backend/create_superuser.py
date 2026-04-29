"""Создание суперпользователя для локального входа в /docs."""

from __future__ import annotations

import asyncio

from core.database import async_session_maker
from core.security import get_password_hash
from models.user import User


async def main() -> None:
    """Добавить главного администратора в таблицу users."""

    async with async_session_maker() as session:
        session.add(
            User(
                name="aman",
                role="admin",
                password_hash=get_password_hash("admin"),
                phone="+996000000000",
                is_active=True,
            )
        )
        await session.commit()


if __name__ == "__main__":
    asyncio.run(main())
