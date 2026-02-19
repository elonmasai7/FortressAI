# FortressAI

FortressAI is a full-stack cybersecurity demo platform for hackathon/pitch scenarios. It combines:

- A **Next.js 14 dashboard frontend** (`frontend/`) with a live simulation UI
- A **FastAPI backend** (`backend/`) with agent-style endpoints
- Optional infrastructure via Docker Compose: **Postgres (Timescale)**, **Redis**, **Celery**, **WireGuard**, **Hyperledger peer**

The primary demo experience is:

- `/` -> multi-slide Fortress deck
- `/demo` -> focused live simulation (Attack -> Response -> Solution -> Training handbook)

## What is FortressAI?

FortressAI is a cybersecurity orchestration concept that demonstrates how a security team can move from **detection** to **containment** to **proof of compliance** in a single, fast incident-response flow.

At a high level, FortressAI models four cooperating functions:

1. **Recon**
   Finds exposed services and risky attack surfaces (for example exposed RDP on critical infrastructure targets).
2. **Simulate**
   Emulates likely attack behavior (such as phishing campaigns) to test detection quality and response readiness.
3. **Respond**
   Activates containment controls (for example secure tunnel actions and kill-switch style traffic restrictions) to reduce active risk quickly.
4. **Log**
   Records tamper-evident incident evidence for audit/compliance reporting.

In this repository, FortressAI is implemented as a **demo-ready system** with:

- A live dashboard UI for real-time incident storytelling
- FastAPI endpoints representing each response phase
- WebSocket metric streaming for live updates
- Database persistence for threat/tunnel events
- Optional infrastructure integrations (WireGuard, Hyperledger peer) with simulation fallbacks

### Why FortressAI exists

Security demos often show disconnected tooling. FortressAI is designed to show the opposite: a connected response chain where every phase is linked and measurable.

Key outcomes the demo emphasizes:

- **Speed:** quick transition from alert to containment
- **Clarity:** a single operational view for what happened and what was done
- **Resilience:** graceful fallback to mock/simulated mode when live dependencies are unavailable
- **Auditability:** structured event and compliance logging

### What FortressAI is and is not

FortressAI in this repo is best understood as a **reference demo platform** for product validation, hackathon judging, and stakeholder storytelling.

It is:

- A practical full-stack prototype
- Suitable for live demos and technical walkthroughs
- Built to run in constrained local/dev environments

It is not:

- A hardened production SOC platform out of the box
- A complete replacement for enterprise SIEM/SOAR deployment practices

Use it as an accelerator for demonstrations, architecture conversations, and iterative security product development.

## What This Repo Contains

- **Frontend demo UX** for SOC-style incident simulation
- **Backend APIs** for recon/simulate/respond/log phases
- **WebSocket status stream** for live dashboard updates
- **Mock fallbacks** so frontend can still run when backend is offline
- **Docker Compose stack** for an end-to-end local environment

## Architecture

```text
frontend (Next.js 14)
  ├─ /            -> FortressDeck slides
  ├─ /demo        -> live 30s simulation screen
  ├─ /api/*       -> mock Next API routes for UI fallback
  └─ ws client    -> ws://<backend>/ws/status

backend (FastAPI)
  ├─ POST /scan      (Recon Agent)
  ├─ POST /simulate  (Simulate Agent)
  ├─ POST /tunnel    (Respond Agent)
  ├─ POST /log       (Log Agent)
  ├─ GET  /status    (live metrics snapshot)
  ├─ GET  /demo      (scripted 30s-ish flow)
  └─ WS   /ws/status (1s push stream)

infra (docker-compose)
  ├─ postgres/timescale
  ├─ redis
  ├─ celery worker
  ├─ wireguard
  └─ hyperledger peer
```

## Repository Layout

```text
.
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/api.py
│   │   ├── ws/socket.py
│   │   ├── services/
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── tasks.py
│   ├── scripts/bootstrap.sh
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── demo/page.tsx
│   │   └── api/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── README.md
├── infra/
├── seed/
├── scripts/
├── docker-compose.yml
└── README.md
```

## Quick Start

### Option A: Frontend only (fastest)

Use this when you only need UI/demo behavior.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

Notes:

- UI will try backend at `http://localhost:8000` by default.
- If backend is unavailable, the frontend uses local mock behavior for simulation.

### Option B: Full stack with Docker Compose

Use this for full API + DB + worker + infra emulation.

```bash
docker compose up --build
```

Services and ports:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`
- WireGuard UDP: `localhost:51820`
- Hyperledger peer: `localhost:7051`

## Local Development Commands

### Root

```bash
npm run demo
```

Runs frontend demo script from root package config.

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
npm test
npm run lint
```

### Backend (without Docker)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

If running backend outside Docker, set environment variables (notably `DATABASE_URL`, `REDIS_URL`) to reachable local services.

## API Reference (Backend)

Base URL: `http://localhost:8000`

### `POST /scan`

Recon scan (nmap-based with fallback seed findings).

Request:

```json
{
  "target": "hkma.gov.hk",
  "ports": "1-10000"
}
```

### `POST /simulate`

Phishing simulation scoring (keyword/BERT-style heuristic output).

Request:

```json
{
  "email_text": "HKMA urgent compliance alert. Verify account and wire payment."
}
```

### `POST /tunnel`

Tunnel deployment flow (real or simulated WireGuard depending on env/runtime).

Request:

```json
{
  "endpoint": "hk-relay-01.cyberport.hk"
}
```

### `POST /log`

Immutable logging step (Hyperledger-aware simulated hash output).

Request:

```json
{
  "threat_id": "0xabc",
  "compliance": "HKMA_2026",
  "payload": "demo"
}
```

### `GET /status`

Returns current metrics snapshot for dashboard polling/streaming.

### `GET /demo`

Runs a scripted multi-step demo timeline and returns a combined result.

### `GET /qr`

Returns a PNG QR that points to the frontend demo URL.

### `WS /ws/status`

Streams `metrics_store.snapshot()` every second.

## Frontend Routes

- `/` -> main Fortress deck (`frontend/components/FortressDeck.tsx`)
- `/demo` -> live simulation dashboard (`frontend/app/demo/page.tsx`)

Next.js mock API routes (frontend-side):

- `GET /api/scan`
- `POST /api/tunnel`
- `GET /api/logs`

These are useful for local UI fallback behavior.

## Environment Variables

### Frontend

- `NEXT_PUBLIC_API_BASE` (default: `http://localhost:8000`)

### Backend

- `REDIS_URL` (default: `redis://redis:6379/0`)
- `DATABASE_URL` (default: `postgresql+psycopg://fortress:fortress@postgres:5432/fortressai`)
- `DEMO_TARGET` (default: `hkma.gov.hk`)
- `WG_CONFIG_PATH` (default: `/etc/wireguard/fortressai.conf`)
- `ENABLE_REAL_WG` (`true`/`false`)
- `ENABLE_REAL_FABRIC` (`true`/`false`)
- `FABRIC_PEER_ADDRESS` (default: `hyperledger:7051`)

## Data and Scripts

- Seed data:
  - `seed/hk_targets.json`
  - `seed/phishing_templates.json`
- Scripts:
  - `scripts/generate_qr.sh` -> saves backend QR to `frontend/public/demo-qr.png`
  - `scripts/demo_video_script.md` -> 30s presentation narrative

## Demo Flow (Current `/demo`)

The current live demo UI is focused on:

1. **Attack** phase (red)
2. **Response** phase (yellow/green transition)
3. **Solution** phase (green)
4. **Training handbook** panel shown after solution state

The UI auto-advances on a 30-second timeline and can be reset via **Reset Demo**.

## Troubleshooting

### Frontend cannot reach backend

- Verify backend is running on `http://localhost:8000`
- Set explicit base URL:

```bash
cd frontend
NEXT_PUBLIC_API_BASE=http://localhost:8000 npm run dev
```

### WebSocket not connecting

- Confirm backend route `ws://localhost:8000/ws/status`
- Check proxy/network restrictions in your environment
- UI should still render using fallback simulation when disconnected

### WireGuard operations fail in backend

- This can happen outside privileged/container environments
- Backend falls back to simulated deployment timings/results when real WG commands fail

### Nmap scan issues

- Ensure `nmap` exists (Docker backend image installs it)
- If scanning fails, backend uses seed fallback findings

### Docker Compose health issues

- Inspect service logs:

```bash
docker compose logs -f backend frontend postgres redis celery wireguard hyperledger
```

- Rebuild clean:

```bash
docker compose down -v
docker compose up --build
```

## Security and Demo Disclaimer

This repository is a **demo/simulation environment**. It is not a hardened production security platform as-is. Several behaviors intentionally degrade to mock/fallback mode to keep demos resilient in constrained environments.

## Additional Docs

- Frontend-specific details: `frontend/README.md`
