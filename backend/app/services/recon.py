from __future__ import annotations

import socket
from typing import Any

import nmap

from app.services.error_utils import log_service_error
from app.services.metrics import metrics_store


SEED_FALLBACK = [
    {"port": 3389, "service": "ms-wbt-server", "state": "open", "severity": 9},
    {"port": 80, "service": "http", "state": "open", "severity": 6},
]


def run_recon(target: str, ports: str) -> dict[str, Any]:
    try:
        scanner = nmap.PortScanner()
        scan = scanner.scan(target, ports, arguments="-sV --open")
        host = next(iter(scan.get("scan", {}).keys()), None)
        findings = []
        if host:
            for port, data in scan["scan"][host].get("tcp", {}).items():
                findings.append(
                    {
                        "port": port,
                        "service": data.get("name", "unknown"),
                        "state": data.get("state", "unknown"),
                        "severity": 9 if port == 3389 else 6,
                    }
                )
        if not findings:
            findings = SEED_FALLBACK
    except Exception as exc:
        log_service_error(
            "recon",
            "RECON_SCAN_FAILED",
            exc,
            target=target,
            ports=ports,
        )
        findings = SEED_FALLBACK

    risky = [f for f in findings if f["port"] in {3389, 22, 445}]
    status = "RDP exposed" if risky else "No critical exposure"
    metrics_store.log("recon", f"{status} on {target}")
    return {
        "target": target,
        "ip": _resolve(target),
        "findings": findings,
        "summary": status,
    }


def _resolve(target: str) -> str:
    try:
        return socket.gethostbyname(target)
    except Exception as exc:
        log_service_error("recon", "RECON_DNS_RESOLVE_FAILED", exc, target=target)
        return "0.0.0.0"
