"""Точка входа FastAPI приложения."""

from fastapi import FastAPI
from routers import auth, products, orders, users, analytics, bot

app = FastAPI(title="LogiHub API")

# TODO: implement middleware
# TODO: implement router inclusion

@app.get("/health")
async def health_check() -> dict:
    """Проверка жизнеспособности сервиса."""
    # TODO: implement
    return {"status": "ok"}
