import asyncio
import socket

import pytest
import socketio
import uvicorn

import app.main as main_module
from app.realtime import emit_alert_to_user
from app.security import create_access_token


@pytest.fixture
async def socketio_server(monkeypatch):
    # Keep test isolated from external DB availability.
    monkeypatch.setattr(main_module, "init_db", lambda: None)

    host = "127.0.0.1"
    with socket.socket() as sock:
        sock.bind((host, 0))
        port = sock.getsockname()[1]
    config = uvicorn.Config(main_module.app, host=host, port=port, log_level="error")
    server = uvicorn.Server(config)

    task = asyncio.create_task(server.serve())
    try:
        for _ in range(60):
            if server.started:
                break
            await asyncio.sleep(0.05)
        else:
            raise RuntimeError("Uvicorn server did not start in time")

        yield f"http://{host}:{port}"
    finally:
        server.should_exit = True
        await asyncio.wait_for(task, timeout=5)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_socketio_network_connect_and_receive_alert(socketio_server):
    token = create_access_token("net-user-1", "net-user@example.com")

    received_event = asyncio.Event()
    payload_holder = {}

    client = socketio.AsyncClient(reconnection=False)

    @client.on("alerts:update")
    async def on_alert(payload):
        payload_holder.update(payload)
        received_event.set()

    await client.connect(
        socketio_server,
        socketio_path="socket.io",
        transports=["websocket"],
        auth={"token": token},
    )

    await emit_alert_to_user(
        "net-user-1",
        {
            "id": "net-alert-1",
            "severity": "critical",
            "category": "wallet-monitor",
            "title": "Suspicious wallet transaction",
            "message": "network test alert",
            "status": "open",
            "created_at": "2026-02-22T00:00:00Z",
        },
    )

    await asyncio.wait_for(received_event.wait(), timeout=3)
    assert payload_holder["id"] == "net-alert-1"
    assert payload_holder["severity"] == "critical"

    await client.disconnect()


@pytest.mark.integration
@pytest.mark.asyncio
async def test_socketio_network_rejects_invalid_token(socketio_server):
    client = socketio.AsyncClient(reconnection=False)
    with pytest.raises(socketio.exceptions.ConnectionError):
        await client.connect(
            socketio_server,
            socketio_path="socket.io",
            transports=["websocket"],
            auth={"token": "bad-token"},
        )
