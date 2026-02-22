from __future__ import annotations

import re
import socket
import ssl
import unicodedata
from datetime import datetime, timezone
from urllib.parse import urlparse

from sqlalchemy.orm import Session

from app.models import (
    AuditLog,
    ContractAnalysis,
    PhishingCheck,
    SecurityAlert,
    TokenApproval,
    User,
    WalletEvent,
    WalletProfile,
)
from app.services.alerts import create_alert
from app.services.error_utils import log_service_error
from app.services.integrations import (
    etherscan_contract_info,
    etherscan_txlist,
    fetch_metamask_phishing_domains,
    fetch_phishtank_domains,
    goplus_address_security,
    goplus_token_security,
    usd_value_from_native_wei,
)
from app.services.metrics import metrics_store

TRUSTED_DOMAINS = {
    "metamask.io",
    "opensea.io",
    "uniswap.org",
    "etherscan.io",
    "coinbase.com",
    "binance.com",
}

APPROVE_SELECTOR = "095ea7b3"
NFT_APPROVE_ALL_SELECTOR = "a22cb465"
MAX_UINT256_SUFFIX = "f" * 64


def _normalize_address(address: str) -> str:
    return (address or "").strip().lower()


def _levenshtein(a: str, b: str) -> int:
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)

    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        cur = [i]
        for j, cb in enumerate(b, start=1):
            ins = cur[j - 1] + 1
            dele = prev[j] + 1
            sub = prev[j - 1] + (0 if ca == cb else 1)
            cur.append(min(ins, dele, sub))
        prev = cur
    return prev[-1]


def _homoglyph_suspicious(domain: str) -> bool:
    normalized = unicodedata.normalize("NFKC", domain)
    return normalized != domain


def _ssl_expiry_days(hostname: str) -> int | None:
    try:
        context = ssl.create_default_context()
        with socket.create_connection((hostname, 443), timeout=2) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as wrapped:
                cert = wrapped.getpeercert()
                not_after = cert.get("notAfter")
                if not not_after:
                    return None
                expiry = datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
                now = datetime.now(timezone.utc)
                return int((expiry - now).total_seconds() // 86400)
    except Exception as exc:
        log_service_error(
            "blockchain_guardian",
            "GUARDIAN_SSL_EXPIRY_CHECK_FAILED",
            exc,
            hostname=hostname,
        )
        return None


def _extract_spender_from_input(data: str) -> str:
    clean = data[2:] if data.startswith("0x") else data
    if len(clean) < 8 + 64:
        return ""
    selector = clean[:8]
    if selector not in (APPROVE_SELECTOR, NFT_APPROVE_ALL_SELECTOR):
        return ""

    raw = clean[8 : 8 + 64]
    return "0x" + raw[-40:]


async def monitor_wallet(
    db: Session,
    user: User,
    wallet_address: str,
    chain: str,
    threshold_usd: float,
    label: str,
) -> dict:
    normalized_wallet = _normalize_address(wallet_address)
    profile = (
        db.query(WalletProfile)
        .filter(
            WalletProfile.user_id == user.id,
            WalletProfile.wallet_address == normalized_wallet,
            WalletProfile.chain == chain,
        )
        .first()
    )
    if not profile:
        profile = WalletProfile(
            user_id=user.id,
            wallet_address=normalized_wallet,
            chain=chain,
            label=label,
            alert_threshold_usd=threshold_usd,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    txs = await etherscan_txlist(normalized_wallet, chain, limit=100)
    metamask_blocklist = await fetch_metamask_phishing_domains()

    existing_contracts = {
        row.counterparty
        for row in db.query(WalletEvent)
        .filter(WalletEvent.wallet_id == profile.id, WalletEvent.event_type == "first_contract")
        .all()
    }

    new_events: list[dict] = []
    alerts = 0
    for tx in txs[:30]:
        tx_hash = tx.get("hash", "")
        to_addr = _normalize_address(tx.get("to", ""))
        from_addr = _normalize_address(tx.get("from", ""))
        value_usd = usd_value_from_native_wei(tx.get("value", "0"), chain)

        is_outgoing = from_addr == normalized_wallet
        risk_score = 0
        reasons: list[str] = []

        if is_outgoing and value_usd >= threshold_usd:
            risk_score += 40
            reasons.append(f"Large outgoing transfer ${value_usd:,.2f}")

        addr_security = await goplus_address_security(to_addr or from_addr, chain)
        if addr_security.get("blackmail_activities") == "1" or addr_security.get("phishing_activities") == "1":
            risk_score += 35
            reasons.append("GoPlus flagged counterparty for scam activity")

        if to_addr and to_addr.startswith("0x") and to_addr not in existing_contracts:
            risk_score += 15
            reasons.append("First-time interaction with this contract/address")
            existing_contracts.add(to_addr)

        input_data = (tx.get("input") or "").lower()
        if len(input_data) > 10 and to_addr and to_addr in metamask_blocklist:
            risk_score += 40
            reasons.append("Destination appears on phishing blacklist")

        if risk_score <= 0:
            continue

        event_type = "suspicious_outgoing" if is_outgoing else "suspicious_incoming"
        db.add(
            WalletEvent(
                wallet_id=profile.id,
                tx_hash=tx_hash,
                chain=chain,
                event_type=event_type,
                risk_score=min(100, risk_score),
                amount_usd=value_usd,
                counterparty=to_addr if is_outgoing else from_addr,
                details="; ".join(reasons),
            )
        )
        new_events.append(
            {
                "tx_hash": tx_hash,
                "risk_score": min(100, risk_score),
                "amount_usd": round(value_usd, 2),
                "reasons": reasons,
            }
        )

        if risk_score >= 60:
            alerts += 1
            await create_alert(
                db=db,
                user=user,
                severity="critical",
                category="wallet-monitor",
                title="Suspicious wallet transaction",
                message=f"{tx_hash[:10]}... score={min(100, risk_score)}",
                source="etherscan+goplus",
                payload={"tx_hash": tx_hash, "reasons": reasons},
            )

    db.add(
        AuditLog(
            user_id=user.id,
            action="monitor_wallet",
            entity_type="wallet",
            entity_id=profile.id,
            details=f"chain={chain} checked={len(txs[:30])} suspicious={len(new_events)}",
        )
    )
    db.commit()

    metrics_store.increment_threats(alerts)
    return {
        "wallet": normalized_wallet,
        "chain": chain,
        "checked_transactions": len(txs[:30]),
        "suspicious_events": new_events,
        "alerts_created": alerts,
    }


async def scan_approvals(db: Session, user: User, wallet_address: str, chain: str) -> dict:
    normalized_wallet = _normalize_address(wallet_address)
    profile = (
        db.query(WalletProfile)
        .filter(
            WalletProfile.user_id == user.id,
            WalletProfile.wallet_address == normalized_wallet,
            WalletProfile.chain == chain,
        )
        .first()
    )
    if not profile:
        profile = WalletProfile(user_id=user.id, wallet_address=normalized_wallet, chain=chain)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    txs = await etherscan_txlist(normalized_wallet, chain, limit=100)
    findings: list[dict] = []

    for tx in txs[:100]:
        input_data = (tx.get("input") or "").lower()
        if not input_data.startswith("0x"):
            continue

        selector = input_data[2:10]
        if selector not in (APPROVE_SELECTOR, NFT_APPROVE_ALL_SELECTOR):
            continue

        spender = _extract_spender_from_input(input_data)
        allowance = input_data[-64:] if len(input_data) > 74 else ""
        risk = 20
        reasons = ["Approval transaction detected"]

        if allowance == MAX_UINT256_SUFFIX:
            risk += 40
            reasons.append("Unlimited approval (type(uint256).max)")

        security = await goplus_address_security(spender, chain)
        if security.get("phishing_activities") == "1":
            risk += 35
            reasons.append("Spender flagged by GoPlus")

        result = {
            "tx_hash": tx.get("hash", ""),
            "spender": spender,
            "risk_score": min(100, risk),
            "reasons": reasons,
            "revoke_recommendation": {
                "method": "approve",
                "spender": spender,
                "value": "0",
            },
        }
        findings.append(result)

        db.add(
            TokenApproval(
                wallet_id=profile.id,
                chain=chain,
                tx_hash=result["tx_hash"],
                spender_address=spender,
                allowance=allowance,
                risk_score=min(100, risk),
                reasons="; ".join(reasons),
            )
        )

        if risk >= 70:
            await create_alert(
                db=db,
                user=user,
                severity="high",
                category="token-approval",
                title="High-risk token approval",
                message=f"{result['tx_hash'][:10]}... to {spender[:10]}...",
                source="etherscan+goplus",
                payload=result,
            )

    db.add(
        AuditLog(
            user_id=user.id,
            action="scan_approvals",
            entity_type="wallet",
            entity_id=profile.id,
            details=f"chain={chain} findings={len(findings)}",
        )
    )
    db.commit()
    return {
        "wallet": normalized_wallet,
        "chain": chain,
        "approvals": findings[:50],
        "count": len(findings),
    }


async def analyze_contract(db: Session, user: User, contract_address: str, chain: str) -> dict:
    normalized = _normalize_address(contract_address)
    source_info = await etherscan_contract_info(normalized, chain)
    token_sec = await goplus_token_security(normalized, chain)

    findings: list[str] = []
    risk = 0

    source_code = str(source_info.get("SourceCode", "") or "")
    abi = str(source_info.get("ABI", "") or "")
    verified = source_info.get("ABI") not in ("Contract source code not verified", None, "")
    if not verified:
        risk += 40
        findings.append("Contract source is unverified on explorer")

    keyword_checks = {
        "selfdestruct": "Self-destruct capability present",
        "mint": "Mint function found",
        "blacklist": "Blacklist logic detected",
        "settax": "Tax/fee setter present",
        "upgradeTo": "Proxy upgrade function exposed",
        "onlyOwner": "Owner-restricted privileged operations",
    }
    combined = (source_code + " " + abi).lower()
    for key, label in keyword_checks.items():
        if key.lower() in combined:
            risk += 8
            findings.append(label)

    if token_sec.get("is_honeypot") == "1":
        risk += 50
        findings.append("GoPlus indicates honeypot risk")
    if token_sec.get("hidden_owner") == "1":
        risk += 20
        findings.append("GoPlus hidden owner detected")
    if token_sec.get("can_take_back_ownership") == "1":
        risk += 15
        findings.append("Owner can reclaim ownership")

    risk = min(100, risk)
    verdict = "high" if risk >= 70 else "medium" if risk >= 40 else "low"

    row = ContractAnalysis(
        user_id=user.id,
        chain=chain,
        contract_address=normalized,
        risk_score=risk,
        verdict=verdict,
        findings="; ".join(findings),
    )
    db.add(row)
    db.add(
        AuditLog(
            user_id=user.id,
            action="analyze_contract",
            entity_type="contract",
            entity_id=normalized,
            details=f"chain={chain} risk={risk}",
        )
    )
    db.commit()

    if risk >= 70:
        await create_alert(
            db=db,
            user=user,
            severity="critical",
            category="contract-analysis",
            title="Malicious contract risk detected",
            message=f"{normalized[:10]}... risk={risk}",
            source="etherscan+goplus",
            payload={"findings": findings},
        )

    return {
        "contract_address": normalized,
        "chain": chain,
        "risk_score": risk,
        "verdict": verdict,
        "findings": findings,
        "verified": verified,
    }


async def check_phishing_url(db: Session, user: User, url: str) -> dict:
    parsed = urlparse(url if re.match(r"^https?://", url, flags=re.I) else f"https://{url}")
    domain = (parsed.hostname or "").lower()

    metamask_blocklist, phishtank_blocklist = await fetch_metamask_phishing_domains(), await fetch_phishtank_domains()

    reasons: list[str] = []
    risk = 0
    malicious = False

    if domain in metamask_blocklist:
        risk += 60
        malicious = True
        reasons.append("Exact match in MetaMask phishing blacklist")

    if domain in phishtank_blocklist:
        risk += 60
        malicious = True
        reasons.append("Exact match in PhishTank feed")

    for trusted in TRUSTED_DOMAINS:
        if domain == trusted:
            continue
        distance = _levenshtein(domain, trusted)
        if distance <= 2:
            risk += 25
            reasons.append(f"Typosquatting risk vs {trusted}")
            break

    if _homoglyph_suspicious(domain):
        risk += 20
        reasons.append("Unicode homoglyph/normalization mismatch")

    ssl_days = _ssl_expiry_days(domain) if parsed.scheme == "https" and domain else None
    if ssl_days is not None and ssl_days < 10:
        risk += 15
        reasons.append("TLS certificate close to expiry")

    risk = min(100, risk)
    malicious = malicious or risk >= 60

    db.add(
        PhishingCheck(
            user_id=user.id,
            url=url,
            domain=domain,
            risk_score=risk,
            malicious=malicious,
            reasons="; ".join(reasons),
        )
    )
    db.add(
        AuditLog(
            user_id=user.id,
            action="check_phishing",
            entity_type="url",
            entity_id=domain,
            details=f"risk={risk} malicious={malicious}",
        )
    )
    db.commit()

    if malicious:
        await create_alert(
            db=db,
            user=user,
            severity="high",
            category="phishing",
            title="Phishing URL detected",
            message=f"{domain} risk={risk}",
            source="metamask+phishtank",
            payload={"url": url, "reasons": reasons},
        )

    return {
        "url": url,
        "domain": domain,
        "risk_score": risk,
        "malicious": malicious,
        "reasons": reasons,
        "ssl_days_to_expiry": ssl_days,
    }


async def ingest_security_events(db: Session, user: User, source: str, events: list[dict]) -> dict:
    generated = 0
    for event in events:
        severity = str(event.get("severity", "medium")).lower()
        message = str(event.get("message", ""))
        title = f"{source.upper()} security event"
        category = "siem" if source in ("elk", "splunk") else source

        if any(token in message.lower() for token in ("phish", "malicious", "drain", "exploit", "rpc anomaly")):
            await create_alert(
                db=db,
                user=user,
                severity=severity if severity in ("low", "medium", "high", "critical") else "medium",
                category=category,
                title=title,
                message=message,
                source=source,
                payload=event,
            )
            generated += 1

    db.add(
        AuditLog(
            user_id=user.id,
            action="ingest_events",
            entity_type="integration",
            entity_id=source,
            details=f"received={len(events)} alerts={generated}",
        )
    )
    db.commit()
    return {"source": source, "events_received": len(events), "alerts_generated": generated}


def list_alerts(db: Session, user: User, limit: int = 100) -> list[SecurityAlert]:
    return (
        db.query(SecurityAlert)
        .filter(SecurityAlert.user_id == user.id)
        .order_by(SecurityAlert.created_at.desc())
        .limit(limit)
        .all()
    )


def update_alert_status(db: Session, user: User, alert_id: str, status: str) -> SecurityAlert | None:
    row = db.query(SecurityAlert).filter(SecurityAlert.id == alert_id, SecurityAlert.user_id == user.id).first()
    if not row:
        return None
    row.status = status
    db.add(
        AuditLog(
            user_id=user.id,
            action="alert_status",
            entity_type="security_alert",
            entity_id=alert_id,
            details=f"status={status}",
        )
    )
    db.commit()
    db.refresh(row)
    return row
