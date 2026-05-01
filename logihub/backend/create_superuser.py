"""Создание суперпользователя для локального входа в /docs."""

from __future__ import annotations

import asyncio

from core.database import async_session_maker
from core.security import get_password_hash
from models.user import User


async def main() -> None:
    """Добавить главного администратора в таблицу users."""

    from sqlalchemy import select
    async with async_session_maker() as session:
        # Проверяем, существует ли уже пользователь
        result = await session.execute(select(User).where(User.phone == "+996000000000"))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print("Суперпользователь уже существует.")
            return

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
        print("Суперпользователь успешно создан.")


if __name__ == "__main__":
    asyncio.run(main())
