"""Точка входа FastAPI приложения."""

from fastapi import FastAPI
from routers import auth, products, orders, users, analytics, bot

app = FastAPI(title="LogiHub API")

# TODO: implement middleware

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(users.router)
app.include_router(analytics.router)
app.include_router(bot.router)
app.include_router(analytics.router)

@app.get("/health")
async def health_check() -> dict:
    """Проверка жизнеспособности сервиса."""
    return {"status": "ok"}
