from celery import Celery

from app.config import REDIS_URL
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
