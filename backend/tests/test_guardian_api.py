from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.database import get_db
from app.main import fastapi_app
from app.security import get_current_user


class DummyDB:
    pass


def _override_dependencies():
    db = DummyDB()
    user = SimpleNamespace(id="user-1", email="user@example.com")
    fastapi_app.dependency_overrides[get_db] = lambda: db
    fastapi_app.dependency_overrides[get_current_user] = lambda: user
    return db, user


def test_monitor_wallet_endpoint(monkeypatch):
    _override_dependencies()

    async def fake_monitor_wallet(db, user, wallet_address, chain, threshold_usd, label):
        return {
            "wallet": wallet_address,
            "chain": chain,
            "checked_transactions": 10,
            "suspicious_events": [],
            "alerts_created": 0,
        }

    monkeypatch.setattr("app.routers.guardian.monitor_wallet", fake_monitor_wallet)

    client = TestClient(fastapi_app)
    response = client.post(
        "/guardian/monitor-wallet",
        json={"wallet_address": "0xabc", "chain": "ethereum", "threshold_usd": 1000},
    )
    assert response.status_code == 200
    assert response.json()["wallet"] == "0xabc"


def test_alert_action_not_found(monkeypatch):
    _override_dependencies()
    monkeypatch.setattr("app.routers.guardian.update_alert_status", lambda db, user, alert_id, status: None)

    client = TestClient(fastapi_app)
    response = client.post("/guardian/alerts/alert-1/action", json={"status": "acknowledged"})
    assert response.status_code == 404


def test_ingest_ids_endpoint(monkeypatch):
    _override_dependencies()

    async def fake_ingest(db, user, source, events):
        return {"source": source, "events_received": len(events), "alerts_generated": 1}

    monkeypatch.setattr("app.routers.guardian.ingest_security_events", fake_ingest)

    client = TestClient(fastapi_app)
    response = client.post(
        "/guardian/ingest/ids",
        json={"events": [{"source": "suricata", "severity": "high", "message": "rpc anomaly", "metadata": {}}]},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "suricata"
    assert body["events_received"] == 1

