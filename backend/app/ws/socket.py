import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.database import SessionLocal
from app.models import SecurityAlert
from app.security import decode_token
from app.services.error_utils import log_service_error
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
    except Exception as exc:
        log_service_error("ws", "WS_STATUS_STREAM_FAILED", exc)
        return


@router.websocket("/ws/alerts")
async def alerts_ws(ws: WebSocket):
    token = ws.query_params.get("token", "")
    try:
        payload = decode_token(token)
        user_id = payload.get("sub", "")
        if not user_id:
            await ws.close(code=1008)
            return
    except Exception as exc:
        log_service_error("ws", "WS_ALERTS_AUTH_FAILED", exc)
        await ws.close(code=1008)
        return

    await ws.accept()
    db = SessionLocal()
    try:
        while True:
            rows = db.execute(
                select(SecurityAlert)
                .where(SecurityAlert.user_id == user_id)
                .order_by(SecurityAlert.created_at.desc())
                .limit(25)
            ).scalars()
            await ws.send_json(
                [
                    {
                        "id": row.id,
                        "severity": row.severity,
                        "category": row.category,
                        "title": row.title,
                        "message": row.message,
                        "status": row.status,
                        "created_at": row.created_at.isoformat(),
                    }
                    for row in rows
                ]
            )
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        return
    except Exception as exc:
        log_service_error("ws", "WS_ALERTS_STREAM_FAILED", exc, user_id=user_id)
        return
    finally:
        db.close()
