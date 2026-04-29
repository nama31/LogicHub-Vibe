"""Зависимости FastAPI (DI)."""

from typing import AsyncGenerator
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from core.database import async_session_maker
from models.user import User


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Получение сессии БД."""

    async with async_session_maker() as session:
        yield session


async def _get_user_from_token(token: str, db: AsyncSession) -> User:
    """Внутренняя проверка JWT и загрузка пользователя."""

    if not settings.jwt_secret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="JWT secret is not configured")

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")
        user_uuid = UUID(str(user_id))
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials") from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token") from exc

    user = await db.get(User, user_uuid)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

    return user


async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Получение текущего пользователя по JWT."""

    return await _get_user_from_token(token.credentials, db)


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Проверка прав админа."""

    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")

    return current_user


async def require_admin_or_bot_secret(
    x_bot_secret: str | None = Header(default=None, alias="X-Bot-Secret"),
    token: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Разрешить админа по JWT или бота по X-Bot-Secret для read-only sync."""

    if x_bot_secret is not None:
        if not settings.bot_secret:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Bot secret is not configured")
        if x_bot_secret == settings.bot_secret:
            return None
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bot secret")

    if token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    current_user = await _get_user_from_token(token.credentials, db)
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")

    return current_user


async def require_bot_secret(x_bot_secret: str = Header(..., alias="X-Bot-Secret")) -> bool:
    """Проверка X-Bot-Secret header."""

    if not settings.bot_secret:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Bot secret is not configured")

    if x_bot_secret != settings.bot_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bot secret")

    return True
