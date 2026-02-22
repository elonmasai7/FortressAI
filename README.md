# FortressAI

FortressAI is a full-stack cybersecurity platform with two operating modes in one repo:

- Demo mode: original attack-response-log simulation flow for presentations
- Guardian mode: production-oriented blockchain wallet security for individuals and SMEs

The Guardian extension is focused on wallet drain prevention, phishing detection, risky approvals, malicious contract analysis, and real-time alerting.

## Tech Stack

- Frontend: Next.js 14 (TypeScript)
- Backend: FastAPI (Python)
- Realtime: Socket.IO + WebSocket endpoints
- Queue: Celery + Redis
- Database: PostgreSQL 16 + TimescaleDB
- Infra: Docker Compose (local), Kubernetes/EKS manifests (production)

## Current Features

### Demo Mode

- Recon / simulate / respond / log API pipeline
- Live dashboard at `/demo`
- Metrics websocket at `/ws/status`

### Guardian Mode

- JWT auth (`/guardian/auth/register`, `/guardian/auth/login`)
- Wallet monitoring (`/guardian/monitor-wallet`)
- Token approval scanner (`/guardian/scan-approvals`)
- Smart contract analyzer (`/guardian/analyze-contract`)
- Phishing URL checker (`/guardian/check-phishing`)
- Alert management (`/guardian/alerts`, alert actions)
- SIEM / IDS / firewall ingestion endpoints
- Real-time alert push over Socket.IO (`alerts:update`)

## Integrations

Implemented with real API/service paths and cache fallbacks:

- Etherscan API (tx history and contract metadata)
- GoPlus Security API (address/token risk signals)
- MetaMask `eth-phishing-detect` feed
- PhishTank feed
- ELK-compatible ingest hook (`ELASTIC_INGEST_URL`, optional)
- Alert providers via Celery queue:
  - Discord webhook
  - Telegram bot
  - SendGrid email
  - Twilio SMS

## Architecture

```text
frontend (Next.js)
  /demo       -> legacy cyber demo UI
  /guardian   -> blockchain security dashboard

backend (FastAPI + Socket.IO ASGI app)
  /scan, /simulate, /tunnel, /log
  /guardian/*
  /ws/status
  Socket.IO event: alerts:update

services
  blockchain_guardian.py  -> monitor/scan/analyze/check logic
  integrations.py         -> Etherscan/GoPlus/phishing feeds
  alerts.py               -> alert persistence + SIEM + realtime emit
  notifications.py        -> provider fanout (Discord/Telegram/SendGrid/Twilio)

tasks (Celery)
  guardian scans
  alert delivery with retries
```

## Repository Layout

```text
.
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── realtime.py
│   │   ├── routers/
│   │   │   ├── api.py
│   │   │   └── guardian.py
│   │   ├── services/
│   │   ├── tasks.py
│   │   └── ws/socket.py
│   └── tests/
├── frontend/
│   ├── app/
│   │   ├── demo/page.tsx
│   │   └── guardian/page.tsx
│   └── lib/
├── infra/
│   └── k8s/
├── scripts/
└── docker-compose.yml
```

## Quick Start

### 1) Run full stack with Docker Compose

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

### 2) Open apps

- Demo: `http://localhost:3000/demo`
- Guardian: `http://localhost:3000/guardian`

## Environment Variables

### Core

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET_KEY`

### Blockchain & Threat Intel

- `ETHERSCAN_API_KEY`
- `ETHERSCAN_BASE_URL` (optional override)
- `GOPLUS_BASE_URL` (optional override)
- `METAMASK_PHISHING_URL` (optional override)
- `PHISHTANK_FEED_URL` (optional override)

### SIEM / Cloud Security

- `ELASTIC_INGEST_URL` (optional)
- `AWS_SECURITY_HUB_ENABLED` (optional)
- `AWS_REGION` (optional)

### Alert Providers (Optional)

- `DISCORD_WEBHOOK_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `SENDGRID_API_KEY`
- `ALERT_EMAIL_FROM`
- `ALERT_EMAIL_TO`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `TWILIO_TO_NUMBER`

## API Summary

Base URL: `http://localhost:8000`

### Demo APIs

- `POST /scan`
- `POST /simulate`
- `POST /tunnel`
- `POST /log`
- `GET /status`

### Guardian APIs

- `POST /guardian/auth/register`
- `POST /guardian/auth/login`
- `POST /guardian/monitor-wallet`
- `POST /guardian/scan-approvals`
- `POST /guardian/analyze-contract`
- `POST /guardian/check-phishing`
- `GET /guardian/alerts`
- `POST /guardian/alerts/{alert_id}/action`
- `POST /guardian/ingest/siem`
- `POST /guardian/ingest/ids`
- `POST /guardian/ingest/firewall`

### Realtime

- `WS /ws/status` (legacy metrics)
- Socket.IO namespace default at `/socket.io`
- Socket.IO auth: `auth.token = <JWT>`
- Event emitted by backend: `alerts:update`

## Alert Delivery Queue

Alert fanout is queued through Celery task:

- `tasks.alert.deliver`

Retry strategy:

- Exponential backoff
- Jitter enabled
- Max retries: 5

## Testing

### Frontend

```bash
cd frontend
npm test -- --watch=false
npm run build
```

### Backend

```bash
pip install -r backend/requirements.txt
pytest -q backend/tests
```

Current backend tests include:

- Guardian route behavior
- Risk-scoring paths
- Socket.IO JWT connect + `alerts:update` emission flow

## Deployment

### Fast EKS update

Use:

```bash
scripts/deploy_eks_5min.sh
```

Required env:

- `AWS_ACCOUNT_ID`

Optional env:

- `AWS_REGION`
- `IMAGE_TAG`
- `K8S_NAMESPACE`
- `ECR_REPO_BACKEND`
- `ECR_REPO_FRONTEND`

### K8s Secrets Template

Use `infra/k8s/guardian-secrets.example.yaml` as the starting point for cluster secrets.

## Security Notes

- Private keys are never stored.
- Wallet monitoring is consent-based via registered wallet addresses.
- Sensitive integration credentials are expected from env or Kubernetes secrets.
- API middleware includes request rate limiting.

## Known Limits

- Some provider features require API keys and may fallback to cache/partial signals without them.
- Contract analysis currently combines explorer metadata + risk feeds + heuristic checks, not full symbolic execution in cluster by default.
- Legacy demo tests may reference older UI labels; Guardian tests are separate.
