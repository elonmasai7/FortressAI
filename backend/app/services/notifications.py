from __future__ import annotations

import httpx

from app.config import (
    ALERT_EMAIL_FROM,
    ALERT_EMAIL_TO,
    DISCORD_WEBHOOK_URL,
    SENDGRID_API_KEY,
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID,
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER,
    TWILIO_TO_NUMBER,
)


def _send_discord(message: str) -> bool:
    if not DISCORD_WEBHOOK_URL:
        return False

    response = httpx.post(DISCORD_WEBHOOK_URL, json={"content": message}, timeout=6.0)
    return response.status_code in (200, 204)


def _send_telegram(message: str) -> bool:
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return False

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    response = httpx.post(url, json={"chat_id": TELEGRAM_CHAT_ID, "text": message}, timeout=6.0)
    return response.status_code == 200


def _send_sendgrid(subject: str, message: str) -> bool:
    if not SENDGRID_API_KEY or not ALERT_EMAIL_TO:
        return False

    payload = {
        "personalizations": [{"to": [{"email": ALERT_EMAIL_TO}]}],
        "from": {"email": ALERT_EMAIL_FROM},
        "subject": subject,
        "content": [{"type": "text/plain", "value": message}],
    }
    response = httpx.post(
        "https://api.sendgrid.com/v3/mail/send",
        json=payload,
        headers={"Authorization": f"Bearer {SENDGRID_API_KEY}"},
        timeout=8.0,
    )
    return response.status_code in (200, 202)


def _send_twilio(message: str) -> bool:
    if not (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER and TWILIO_TO_NUMBER):
        return False

    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
    response = httpx.post(
        url,
        data={"From": TWILIO_FROM_NUMBER, "To": TWILIO_TO_NUMBER, "Body": message},
        auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN),
        timeout=8.0,
    )
    return response.status_code in (200, 201)


def deliver_alert_channels(subject: str, message: str) -> dict:
    outcomes: dict[str, bool] = {}

    for name, sender in (
        ("discord", lambda: _send_discord(message)),
        ("telegram", lambda: _send_telegram(message)),
        ("sendgrid", lambda: _send_sendgrid(subject, message)),
        ("twilio", lambda: _send_twilio(message)),
    ):
        try:
            outcomes[name] = sender()
        except Exception:
            outcomes[name] = False

    configured = [
        DISCORD_WEBHOOK_URL,
        TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID,
        SENDGRID_API_KEY and ALERT_EMAIL_TO,
        TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER and TWILIO_TO_NUMBER,
    ]
    has_any_configured = any(bool(item) for item in configured)

    if has_any_configured and not any(outcomes.values()):
        raise RuntimeError("All configured alert providers failed")

    return outcomes
