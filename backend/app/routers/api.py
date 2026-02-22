from __future__ import annotations

import asyncio
from datetime import datetime

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Threat, Tunnel
from app.schemas import LogRequest, ScanRequest, SimulateRequest, TunnelRequest
from app.services.logging_agent import immutable_log
from app.services.metrics import metrics_store
from app.services.recon import run_recon
from app.services.respond import deploy_tunnel
from app.services.simulate import detect_phishing

router = APIRouter()


@router.post("/scan")
def scan(req: ScanRequest = Body(default_factory=ScanRequest), db: Session = Depends(get_db)):
    try:
        result = run_recon(req.target, req.ports)
        for finding in result["findings"]:
            db.add(
                Threat(
                    agent="recon",
                    severity=finding["severity"],
                    status="detected",
                    details=f"{result['target']}:{finding['port']} {finding['service']}",
                )
            )
        db.commit()
        return result
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Recon scan failed: {exc}") from exc


@router.post("/simulate")
def simulate(
    req: SimulateRequest = Body(default_factory=lambda: SimulateRequest(email_text="HKMA urgent compliance alert")),
    db: Session = Depends(get_db),
):
    try:
        result = detect_phishing(req.email_text)
        db.add(
            Threat(
                agent="simulate",
                severity=9,
                status="detected",
                details=f"phishing score={result['score']}",
            )
        )
        db.commit()
        return result
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Simulation failed: {exc}") from exc


@router.post("/tunnel")
def tunnel(req: TunnelRequest = Body(default_factory=TunnelRequest), db: Session = Depends(get_db)):
    try:
        result = deploy_tunnel(req.endpoint)
        db.add(Tunnel(endpoint=req.endpoint, latency_ms=result["latency_ms"], active=True))
        db.commit()
        return result
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Tunnel deployment failed: {exc}") from exc


@router.post("/log")
def log(
    req: LogRequest = Body(default_factory=lambda: LogRequest(threat_id="demo-threat")),
    db: Session = Depends(get_db),
):
    try:
        result = immutable_log(req.model_dump())
        db.add(
            Threat(
                agent="log",
                severity=1,
                status="logged",
                details=f"tx={result['tx_hash']} compliance={req.compliance}",
            )
        )
        db.commit()
        return result
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Immutable log write failed: {exc}") from exc


@router.get("/logs")
def logs():
    snapshot = metrics_store.snapshot()
    return {
        "status": "ok",
        "total": len(snapshot["agent_logs"]),
        "logs": snapshot["agent_logs"],
    }


@router.post("/reset")
def reset(db: Session = Depends(get_db)):
    try:
        metrics_store.reset()
        db.query(Threat).delete()
        db.query(Tunnel).delete()
        db.commit()
        return {"status": "ok", "message": "Demo state reset"}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reset failed: {exc}") from exc


@router.get("/status")
def status():
    return metrics_store.snapshot()


@router.get("/demo")
async def demo(db: Session = Depends(get_db)):
    timeline = []
    try:
        scan_result = run_recon("hkma.gov.hk", "1-10000")
        timeline.append({"step": "recon", "message": "RDP exposed on hkma.gov.hk:3389", "ok": True, "at": datetime.utcnow().isoformat()})
        await asyncio.sleep(5)

        sim_result = detect_phishing(
            "HKMA urgent compliance alert. Verify your account and wire payment immediately."
        )
        timeline.append({"step": "simulate", "message": f"Phishing payload confirmed ({int(sim_result['score']*100)}% match)", "ok": True, "at": datetime.utcnow().isoformat()})
        await asyncio.sleep(5)

        tunnel_result = deploy_tunnel("hk-relay-01.cyberport.hk")
        timeline.append({"step": "respond", "message": "VPN tunnel deployed - kill switch active", "ok": True, "at": datetime.utcnow().isoformat()})
        await asyncio.sleep(3)

        log_result = immutable_log({"threat_id": "0xabc", "compliance": "HKMA_2026", "payload": "demo"})
        timeline.append({"step": "log", "message": f"Immutable HKMA compliance logged (tx: {log_result['tx_hash']})", "ok": True, "at": datetime.utcnow().isoformat()})
        await asyncio.sleep(2)

        metrics_store.increment_threats(4)

        db.add(Threat(agent="recon", severity=9, status="detected", details=str(scan_result["summary"])))
        db.add(Threat(agent="simulate", severity=9, status="detected", details=f"score={sim_result['score']}"))
        db.add(Tunnel(endpoint=tunnel_result["endpoint"], latency_ms=tunnel_result["latency_ms"], active=True))
        db.add(Threat(agent="log", severity=1, status="logged", details=f"tx={log_result['tx_hash']}"))
        db.commit()

        return {
            "status": "SAFE",
            "timeline": timeline,
            "recon": scan_result,
            "simulate": sim_result,
            "respond": tunnel_result,
            "log": log_result,
            "metrics": metrics_store.snapshot(),
            "duration_sec": 30,
        }
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Demo run failed: {exc}") from exc
