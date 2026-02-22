import asyncio

from celery import Celery
from sqlalchemy import select

from app.config import REDIS_URL
from app.database import SessionLocal
from app.models import User
from app.services.blockchain_guardian import analyze_contract, monitor_wallet, scan_approvals
from app.services.logging_agent import immutable_log
from app.services.recon import run_recon
from app.services.respond import deploy_tunnel
from app.services.simulate import detect_phishing

celery_app = Celery("fortress_agents", broker=REDIS_URL, backend=REDIS_URL)


@celery_app.task(name="tasks.recon")
def recon_task(target: str, ports: str) -> dict:
    return run_recon(target, ports)


@celery_app.task(name="tasks.simulate")
def simulate_task(email_text: str) -> dict:
    return detect_phishing(email_text)


@celery_app.task(name="tasks.respond")
def respond_task(endpoint: str) -> dict:
    return deploy_tunnel(endpoint)


@celery_app.task(name="tasks.log")
def log_task(payload: dict) -> dict:
    return immutable_log(payload)


@celery_app.task(name="tasks.guardian.monitor_wallet")
def guardian_monitor_wallet_task(user_id: str, wallet_address: str, chain: str, threshold_usd: float, label: str = "") -> dict:
    db = SessionLocal()
    try:
        user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
        if not user:
            return {"error": "user not found"}
        return asyncio.run(monitor_wallet(db, user, wallet_address, chain, threshold_usd, label))
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
    finally:
        db.close()
