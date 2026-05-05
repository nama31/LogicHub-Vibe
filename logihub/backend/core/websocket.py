"""WebSocket Connection Manager for real-time updates."""

import json
from typing import List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
            
        text_data = json.dumps(message)
        # Take a snapshot of connections to avoid modification during iteration
        connections = list(self.active_connections)
        
        async def send_to_one(websocket: WebSocket):
            try:
                await websocket.send_text(text_data)
            except Exception:
                self.disconnect(websocket)

        import asyncio
        tasks = [send_to_one(conn) for conn in connections]
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

manager = ConnectionManager()
