from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.models import AuditLog, SecurityAlert, User
from app.realtime import emit_alert_to_user
from app.services.integrations import push_siem_event
from app.services.metrics import metrics_store


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

    payload_for_client = {
        "id": alert.id,
        "severity": alert.severity,
        "category": alert.category,
        "title": alert.title,
        "message": alert.message,
        "status": alert.status,
        "created_at": alert.created_at.isoformat(),
    }
    await emit_alert_to_user(user.id, payload_for_client)

    outbound = f"[{severity.upper()}] {title}\n{message}"
    try:
        from app.tasks import deliver_alert_task

        deliver_alert_task.delay(f"FortressAI {severity.upper()} alert", outbound)
    except Exception:
        # Never block threat processing if notification queue is unavailable.
        pass

    return alert
