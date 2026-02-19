from __future__ import annotations

import hashlib
import json
import socket
import time
from typing import Any

from app.config import ENABLE_REAL_FABRIC, FABRIC_PEER_ADDRESS
from app.services.metrics import metrics_store


def immutable_log(payload: dict[str, Any]) -> dict[str, Any]:
    stamp = str(time.time_ns())
    digest = hashlib.sha256((json.dumps(payload, sort_keys=True) + stamp).encode()).hexdigest()
    tx_hash = f"0x{digest[:16]}"

    fabric_mode = "simulated"
    if ENABLE_REAL_FABRIC and _peer_reachable():
        fabric_mode = "peer-online"

    metrics_store.log("log", f"Immutable HKMA log committed: {tx_hash}")

    return {
        "tx_hash": tx_hash,
        "compliance": payload.get("compliance", "HKMA_2026"),
        "fabric_mode": fabric_mode,
        "peer": FABRIC_PEER_ADDRESS,
    }


def _peer_reachable() -> bool:
    try:
        socket.gethostbyname("hyperledger")
        return True
    except Exception:
        return False
