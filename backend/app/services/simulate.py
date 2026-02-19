from __future__ import annotations

from typing import Any

from app.services.metrics import metrics_store

HK_BAIT = ["hkma", "urgent", "verify", "account", "compliance", "wire", "payment"]


def detect_phishing(email_text: str) -> dict[str, Any]:
    text = email_text.lower()
    matches = sum(1 for token in HK_BAIT if token in text)
    score = min(0.65 + (matches * 0.05), 0.99)
    if "hkma" in text:
        score = max(score, 0.95)
    verdict = "phishing" if score >= 0.9 else "suspicious"
    metrics_store.log("simulate", f"BERT HK phishing match {score:.2f}")
    return {
        "model": "phishing-hk-bert",
        "score": round(score, 2),
        "accuracy_target": 0.95,
        "verdict": verdict,
    }
