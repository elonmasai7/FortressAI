import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.metrics import metrics_store

router = APIRouter()


@router.websocket("/ws/status")
async def status_ws(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            await ws.send_json(metrics_store.snapshot())
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        return
