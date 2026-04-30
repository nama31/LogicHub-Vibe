"""Точка входа FastAPI приложения."""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, products, orders, users, analytics, bot
from core.websocket import manager

app = FastAPI(title="LogiHub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
