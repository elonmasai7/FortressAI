from __future__ import annotations

from collections import deque
from datetime import datetime
from threading import Lock


class MetricsStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self._agent_logs: deque[dict] = deque(maxlen=250)
        self._threats_blocked = 0
        self._tunnel_active = False
        self._p99_latency = 3000
        self._auto_resolved_pct = 80
        self._owasp_detection = 95

    def log(self, agent: str, message: str, level: str = "info") -> None:
        with self._lock:
            self._agent_logs.appendleft(
                {
                    "timestamp": datetime.utcnow().isoformat(),
                    "agent": agent,
                    "message": message,
                    "level": level,
                }
            )

    def update_tunnel(self, active: bool, latency_ms: int) -> None:
        with self._lock:
            self._tunnel_active = active
            self._p99_latency = latency_ms

    def increment_threats(self, n: int = 1) -> None:
        with self._lock:
            self._threats_blocked += n

    def snapshot(self) -> dict:
        with self._lock:
            return {
                "threats_per_sec": min(self._threats_blocked + 3, 100),
                "threats_blocked": self._threats_blocked,
                "tunnel_active": self._tunnel_active,
                "p99_latency_ms": self._p99_latency,
                "auto_resolved_pct": self._auto_resolved_pct,
                "owasp_detection_pct": self._owasp_detection,
                "agent_logs": list(self._agent_logs),
            }

    def reset(self) -> None:
        with self._lock:
            self._agent_logs.clear()
            self._threats_blocked = 0
            self._tunnel_active = False
            self._p99_latency = 3000


metrics_store = MetricsStore()
