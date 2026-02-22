from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import (
    AlertActionRequest,
    ApprovalScanRequest,
    ContractAnalyzeRequest,
    IngestRequest,
    LoginRequest,
    PhishingCheckRequest,
    RegisterRequest,
    TelegramDiscoverRequest,
    TelegramStoreRequest,
    TokenResponse,
    WalletMonitorRequest,
)
from app.security import create_access_token, get_current_user, hash_password, verify_password
from app.services.blockchain_guardian import (
    analyze_contract,
    check_phishing_url,
    ingest_security_events,
    list_alerts,
    monitor_wallet,
    scan_approvals,
    update_alert_status,
)
from app.services.telegram_helper import discover_and_store_chat_id, fetch_recent_updates, get_stored_chat_id, store_chat_id

router = APIRouter(prefix="/guardian", tags=["guardian"])


@router.post("/auth/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already exists")

    user = User(email=req.email.lower(), password_hash=hash_password(req.password), region=req.region)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token)


@router.post("/auth/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id, user.email)
    return TokenResponse(access_token=token)


@router.post("/monitor-wallet")
async def monitor(
    req: WalletMonitorRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await monitor_wallet(db, user, req.wallet_address, req.chain, req.threshold_usd, req.label)


@router.post("/scan-approvals")
async def approvals(
    req: ApprovalScanRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await scan_approvals(db, user, req.wallet_address, req.chain)


@router.post("/analyze-contract")
async def contract(
    req: ContractAnalyzeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await analyze_contract(db, user, req.contract_address, req.chain)


@router.post("/check-phishing")
async def phishing(
    req: PhishingCheckRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await check_phishing_url(db, user, req.url)


@router.get("/alerts")
def alerts(
    limit: int = 100,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = list_alerts(db, user, limit=min(limit, 200))
    return [
        {
            "id": row.id,
            "severity": row.severity,
            "category": row.category,
            "title": row.title,
            "message": row.message,
            "source": row.source,
            "status": row.status,
            "created_at": row.created_at.isoformat(),
        }
        for row in rows
    ]


@router.post("/alerts/{alert_id}/action")
def alert_action(
    alert_id: str,
    req: AlertActionRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = update_alert_status(db, user, alert_id, req.status)
    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"id": row.id, "status": row.status}


@router.post("/ingest/siem")
async def ingest_siem(
    req: IngestRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await ingest_security_events(db, user, "elk", [event.model_dump() for event in req.events])


@router.post("/ingest/ids")
async def ingest_ids(
    req: IngestRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await ingest_security_events(db, user, "suricata", [event.model_dump() for event in req.events])


@router.post("/ingest/firewall")
async def ingest_firewall(
    req: IngestRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await ingest_security_events(db, user, "firewall", [event.model_dump() for event in req.events])


@router.get("/telegram/chat-id")
async def telegram_chat_id(user: User = Depends(get_current_user)):
    _ = user
    return {"chat_id": get_stored_chat_id()}


@router.post("/telegram/discover-chat-id")
async def telegram_discover_chat_id(
    req: TelegramDiscoverRequest,
    user: User = Depends(get_current_user),
):
    _ = user
    return await discover_and_store_chat_id(req.preferred_chat_id)


@router.post("/telegram/store-chat-id")
async def telegram_store_chat_id(
    req: TelegramStoreRequest,
    user: User = Depends(get_current_user),
):
    _ = user
    ok = store_chat_id(req.chat_id)
    if not ok:
        raise HTTPException(status_code=500, detail="Failed to store chat_id")
    return {"chat_id": get_stored_chat_id(), "stored": True}


@router.get("/telegram/recent-updates")
async def telegram_recent_updates(
    user: User = Depends(get_current_user),
):
    _ = user
    data = await fetch_recent_updates(limit=20)
    return {"ok": data.get("ok", False), "error": data.get("error", ""), "chats": data.get("chats", [])}
