"""Сервис аутентификации."""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import create_access_token, verify_password
from schemas.auth import LoginRequest, TokenResponse
from models.user import User

async def login(request: LoginRequest, db: AsyncSession) -> TokenResponse:
    """Логика авторизации."""

    username = request.username.strip()
    candidate_user: User | None = None

    if username.isdigit():
        candidate_user = await db.scalar(select(User).where(User.tg_id == int(username)))

    if candidate_user is None:
        candidate_user = await db.scalar(select(User).where(User.name == username))

    if candidate_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not candidate_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

    if candidate_user.password_hash is not None and not verify_password(request.password, candidate_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(subject=str(candidate_user.id))
    return TokenResponse(access_token=token, token_type="bearer")

async def get_me(user: User) -> User:
    """Логика получения профиля."""

    return user
