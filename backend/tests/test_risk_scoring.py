from types import SimpleNamespace

import pytest

from app.services import blockchain_guardian as guardian


class FakeQuery:
    def __init__(self, result):
        self._result = result

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self._result

    def all(self):
        return []


class FakeDB:
    def __init__(self):
        self.added = []
        self.profile = None

    def add(self, obj):
        self.added.append(obj)
        if obj.__class__.__name__ == "WalletProfile":
            self.profile = obj

    def commit(self):
        return None

    def refresh(self, obj):
        if getattr(obj, "id", None) is None:
            setattr(obj, "id", "wallet-profile-1")

    def query(self, _model):
        return FakeQuery(self.profile)


@pytest.mark.asyncio
async def test_check_phishing_url_typosquat(monkeypatch):
    fake_db = FakeDB()
    user = SimpleNamespace(id="u-1")

    async def fake_meta():
        return set()

    async def fake_phish():
        return set()

    async def fake_create_alert(*args, **kwargs):
        return None

    monkeypatch.setattr(guardian, "fetch_metamask_phishing_domains", fake_meta)
    monkeypatch.setattr(guardian, "fetch_phishtank_domains", fake_phish)
    monkeypatch.setattr(guardian, "create_alert", fake_create_alert)
    monkeypatch.setattr(guardian, "_ssl_expiry_days", lambda _: None)

    result = await guardian.check_phishing_url(fake_db, user, "metarnask.io")

    assert result["risk_score"] >= 25
    assert any("Typosquatting" in reason for reason in result["reasons"])


@pytest.mark.asyncio
async def test_scan_approvals_flags_unlimited(monkeypatch):
    fake_db = FakeDB()
    user = SimpleNamespace(id="u-1")
    alerts = []

    approval_input = "0x095ea7b3" + ("0" * 24 + "a" * 40) + ("f" * 64)

    async def fake_txlist(wallet, chain, limit=100):
        return [{"hash": "0xhash1", "input": approval_input}]

    async def fake_goplus(spender, chain):
        return {"phishing_activities": "1"}

    async def fake_create_alert(*args, **kwargs):
        alerts.append(kwargs)
        return None

    monkeypatch.setattr(guardian, "etherscan_txlist", fake_txlist)
    monkeypatch.setattr(guardian, "goplus_address_security", fake_goplus)
    monkeypatch.setattr(guardian, "create_alert", fake_create_alert)

    result = await guardian.scan_approvals(fake_db, user, "0xwallet", "ethereum")

    assert result["count"] == 1
    assert result["approvals"][0]["risk_score"] >= 70
    assert len(alerts) == 1

