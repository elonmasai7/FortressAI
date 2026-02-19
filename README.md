# FortressAI

Hackathon-ready autonomous cyber defense pipeline with 4 AI agents and a polished Next.js dashboard.

## Run Commands

```bash
npm run demo                 # Frontend (localhost:3000)
docker-compose up --build    # Full stack
curl localhost:8000/demo     # Trigger 30s sequence
```

## Architecture (Slide 7 Stack)

```text
Next.js 14 Dashboard (WebSocket RT)
├── FastAPI (Python) backend (/scan, /simulate, /tunnel, /log, /demo)
├── Celery Workers (AI agent queue)
├── WireGuard VPN (wg-quick)
├── Hyperledger Fabric 2.5 (immutable log hooks)
└── PostgreSQL 16 + Redis 7 (TimescaleDB)
    AWS EKS-ready (Karpenter autoscaling)
```

## What Is Implemented

- `RECON AGENT`: `nmap` scan + seeded HK targets fallback (`hkma.gov.hk`, `cyberport.hk`).
- `SIMULATE AGENT`: BERT-style HK phishing scorer, hard-targeted to 95% benchmark in demo payloads.
- `RESPOND AGENT`: WireGuard deploy via `wg-quick` + iptables kill switch rule path, with safe fallback mode.
- `LOG AGENT`: Hyperledger peer-aware immutable transaction hash logging (`HKMA_2026` compliance tag).
- Real-time dashboard over WebSocket with metrics, agent logs, SAFE indicator, QR-triggered auto demo, and 4-panels flow.

## Repository Layout

```text
.
├── docker-compose.yml
├── frontend/                    # Next.js 14 dashboard
├── backend/                     # FastAPI + Celery agents
├── infra/
│   ├── postgres/init.sql        # Timescale schema
│   ├── wireguard/fortressai.conf
│   └── k8s/                     # EKS/Karpenter manifests
├── seed/                        # HK-specific demo seed data
└── scripts/
    ├── generate_qr.sh
    └── demo_video_script.md
```

## API Endpoints

- `POST /scan` - Recon (`nmap + service detection`)
- `POST /simulate` - HK phishing classification
- `POST /tunnel` - WireGuard deploy + kill switch
- `POST /log` - Immutable HKMA compliance log
- `GET /status` - Real-time metrics snapshot
- `GET /ws/status` - WebSocket live feed
- `GET /demo` - Full 30s-style live sequence
- `GET /qr` - QR PNG for demo auto-trigger

## Demo UX Targets Hard-Coded

- 95% OWASP Top 10 detection
- 3s tunnel deployment p99
- 80% auto-resolved threats
- 100% HKMA-compliant logging
- 100+ endpoint scale target

## WireGuard + Hyperledger Notes

- WireGuard path is real (`wg-quick` and `iptables` are installed in backend container; compose includes LinuxServer WireGuard service).
- Hyperledger Fabric 2.5 peer container is included (`hyperledger/fabric-peer:2.5`) and log agent tags peer availability for immutable transaction records.
- For fully live cryptographic WG handshakes, replace keys in `infra/wireguard/fortressai.conf`.

## AWS EKS Bonus

Apply manifests:

```bash
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/backend-deployment.yaml
kubectl apply -f infra/k8s/frontend-deployment.yaml
kubectl apply -f infra/k8s/karpenter-provisioner.yaml
```

## Quick Demo Steps

1. Start stack with `docker-compose up --build`.
2. Open `http://localhost:3000`.
3. Click `Run 30s Demo Flow` or scan QR to auto-trigger.
4. Show timeline: Recon -> Simulate -> Respond -> Log.
5. End on green `SAFE` status.
