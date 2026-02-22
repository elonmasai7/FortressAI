from __future__ import annotations

from datetime import datetime

import httpx
from sqlalchemy.orm import Session

from app.config import DISCORD_WEBHOOK_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
from app.models import AuditLog, SecurityAlert, User
from app.services.integrations import push_siem_event
from app.services.metrics import metrics_store


async def _send_discord(message: str) -> None:
    if not DISCORD_WEBHOOK_URL:
        return
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            await client.post(DISCORD_WEBHOOK_URL, json={"content": message})
    except Exception:
        return


async def _send_telegram(message: str) -> None:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": TELEGRAM_CHAT_ID, "text": message}
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            await client.post(url, json=payload)
    except Exception:
        return


async def create_alert(
    db: Session,
    user: User,
    severity: str,
    category: str,
    title: str,
    message: str,
    source: str,
    payload: dict | None = None,
) -> SecurityAlert:
    alert = SecurityAlert(
        user_id=user.id,
        severity=severity,
        category=category,
        title=title,
        message=message,
        source=source,
        payload=str(payload or {}),
        status="open",
    )
    db.add(alert)
    db.add(
        AuditLog(
            user_id=user.id,
            action="alert_created",
            entity_type="security_alert",
            entity_id=alert.id,
            details=f"[{severity}] {category} {title}",
        )
    )
    db.commit()
    db.refresh(alert)

    metrics_store.log("alert", f"{severity}:{category}:{title}", "warning")
    await push_siem_event(
        {
            "type": "security_alert",
            "user_id": user.id,
            "alert_id": alert.id,
            "severity": severity,
            "category": category,
            "title": title,
            "message": message,
            "source": source,
            "created_at": datetime.utcnow().isoformat(),
        }
    )

    outbound = f"[{severity.upper()}] {title}\n{message}"
    await _send_discord(outbound)
    await _send_telegram(outbound)

    return alert
