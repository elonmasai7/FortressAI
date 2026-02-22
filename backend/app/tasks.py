import asyncio

from celery import Celery
from sqlalchemy import select

from app.config import REDIS_URL
from app.database import SessionLocal
from app.models import User
from app.services.blockchain_guardian import analyze_contract, monitor_wallet, scan_approvals
from app.services.error_utils import log_service_error
from app.services.logging_agent import immutable_log
from app.services.notifications import deliver_alert_channels
from app.services.recon import run_recon
from app.services.respond import deploy_tunnel
from app.services.simulate import detect_phishing

celery_app = Celery("fortress_agents", broker=REDIS_URL, backend=REDIS_URL)


@celery_app.task(name="tasks.recon")
def recon_task(target: str, ports: str) -> dict:
    try:
        return run_recon(target, ports)
    except Exception as exc:
        log_service_error("tasks", "TASK_RECON_FAILED", exc, target=target, ports=ports)
        raise


@celery_app.task(name="tasks.simulate")
def simulate_task(email_text: str) -> dict:
    try:
        return detect_phishing(email_text)
    except Exception as exc:
        log_service_error("tasks", "TASK_SIMULATE_FAILED", exc)
        raise


@celery_app.task(name="tasks.respond")
def respond_task(endpoint: str) -> dict:
    try:
        return deploy_tunnel(endpoint)
    except Exception as exc:
        log_service_error("tasks", "TASK_RESPOND_FAILED", exc, endpoint=endpoint)
        raise


@celery_app.task(name="tasks.log")
def log_task(payload: dict) -> dict:
    try:
        return immutable_log(payload)
    except Exception as exc:
        log_service_error("tasks", "TASK_LOG_FAILED", exc)
        raise


@celery_app.task(
    name="tasks.alert.deliver",
    bind=True,
    autoretry_for=(RuntimeError,),
    retry_backoff=True,
    retry_jitter=True,
    retry_kwargs={"max_retries": 5},
)
def deliver_alert_task(self, subject: str, message: str) -> dict:
    try:
        return deliver_alert_channels(subject, message)
    except Exception as exc:
        log_service_error("tasks", "TASK_ALERT_DELIVER_FAILED", exc)
        raise


@celery_app.task(name="tasks.guardian.monitor_wallet")
def guardian_monitor_wallet_task(user_id: str, wallet_address: str, chain: str, threshold_usd: float, label: str = "") -> dict:
    db = SessionLocal()
    try:
        user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
        if not user:
            return {"error": "user not found"}
        return asyncio.run(monitor_wallet(db, user, wallet_address, chain, threshold_usd, label))
    except Exception as exc:
        log_service_error(
            "tasks",
            "TASK_GUARDIAN_MONITOR_WALLET_FAILED",
            exc,
            user_id=user_id,
            chain=chain,
        )
        raise
    finally:
        db.close()


@celery_app.task(name="tasks.guardian.scan_approvals")
def guardian_scan_approvals_task(user_id: str, wallet_address: str, chain: str) -> dict:
    db = SessionLocal()
    try:
        user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
        if not user:
            return {"error": "user not found"}
        return asyncio.run(scan_approvals(db, user, wallet_address, chain))
    except Exception as exc:
        log_service_error(
            "tasks",
            "TASK_GUARDIAN_SCAN_APPROVALS_FAILED",
            exc,
            user_id=user_id,
            chain=chain,
        )
        raise
    finally:
        db.close()


@celery_app.task(name="tasks.guardian.analyze_contract")
def guardian_analyze_contract_task(user_id: str, contract_address: str, chain: str) -> dict:
    db = SessionLocal()
    try:
        user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
        if not user:
            return {"error": "user not found"}
        return asyncio.run(analyze_contract(db, user, contract_address, chain))
    except Exception as exc:
        log_service_error(
            "tasks",
            "TASK_GUARDIAN_ANALYZE_CONTRACT_FAILED",
            exc,
            user_id=user_id,
            chain=chain,
        )
        raise
    finally:
        db.close()
