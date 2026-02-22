from __future__ import annotations

from urllib.parse import parse_qs

import socketio

from app.security import decode_token

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
_sid_user_map: dict[str, str] = {}


@sio.event
async def connect(sid, environ, auth):
    token = ""
    if isinstance(auth, dict):
        token = auth.get("token", "") or ""

    if not token:
        query = parse_qs(environ.get("QUERY_STRING", ""))
        token = (query.get("token") or [""])[0]

    try:
        payload = decode_token(token)
        user_id = payload.get("sub", "")
        if not user_id:
            return False
        _sid_user_map[sid] = user_id
        return True
    except Exception:
        return False


@sio.event
async def disconnect(sid):
    _sid_user_map.pop(sid, None)


async def emit_alert_to_user(user_id: str, alert_payload: dict) -> None:
    recipients = [sid for sid, mapped_user in _sid_user_map.items() if mapped_user == user_id]
    for sid in recipients:
        await sio.emit("alerts:update", alert_payload, to=sid)
