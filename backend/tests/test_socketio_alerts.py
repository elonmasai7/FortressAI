import pytest

from app import realtime
from app.security import create_access_token


@pytest.mark.asyncio
async def test_socketio_jwt_connect_and_alert_emit(monkeypatch):
    realtime._sid_user_map.clear()
    sent = []

    async def fake_emit(event, payload, to=None):
        sent.append({"event": event, "payload": payload, "to": to})

    monkeypatch.setattr(realtime.sio, "emit", fake_emit)

    token = create_access_token("user-123", "user@example.com")
    accepted = await realtime.connect("sid-1", {"QUERY_STRING": ""}, {"token": token})

    assert accepted is True
    await realtime.emit_alert_to_user(
        "user-123",
        {
            "id": "alert-1",
            "severity": "critical",
            "category": "wallet-monitor",
            "title": "Suspicious wallet transaction",
            "message": "drain pattern detected",
            "status": "open",
            "created_at": "2026-02-22T00:00:00Z",
        },
    )

    assert len(sent) == 1
    assert sent[0]["event"] == "alerts:update"
    assert sent[0]["to"] == "sid-1"
    assert sent[0]["payload"]["id"] == "alert-1"

    await realtime.disconnect("sid-1")
    assert "sid-1" not in realtime._sid_user_map


@pytest.mark.asyncio
async def test_socketio_rejects_invalid_jwt():
    realtime._sid_user_map.clear()
    accepted = await realtime.connect("sid-bad", {"QUERY_STRING": ""}, {"token": "invalid"})
    assert accepted is False
