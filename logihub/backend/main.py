"""Точка входа FastAPI приложения."""

import os

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, products, orders, users, analytics, bot, routes as routes_router
from core.websocket import manager

app = FastAPI(title="LogiHub API")

# CORS origins are loaded from the CORS_ORIGINS env var (comma-separated).
# Fallback supports local development and the legacy Render frontend URL.
_cors_origins_raw = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,https://logihub-frontend.onrender.com",
)
_cors_origins = [o.strip() for o in _cors_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(users.router)
app.include_router(analytics.router)
app.include_router(bot.router)
app.include_router(routes_router.router)      # /routes (admin)
app.include_router(routes_router.bot_router)  # /bot/routes (bot internal)

@app.get("/health")
async def health_check() -> dict:
    """Проверка жизнеспособности сервиса."""
    return {"status": "ok"}

@app.websocket("/ws/admin/realtime")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
