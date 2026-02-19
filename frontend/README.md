# FortressAI Frontend (UI-Only)

Production-style Next.js 14 cybersecurity dashboard UI for the Hong Kong Hackathon 2026 pitch deck. This implementation is frontend-only with mocked APIs, mocked realtime updates, static placeholders, and animated slide sections.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Framer Motion
- Recharts + Chart.js
- React Flow
- React Leaflet
- react-google-charts
- qrcode.react
- Jest + React Testing Library

## Run

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`.

By default the UI talks to backend at `http://localhost:8000`.
Override with:

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8000 npm run dev
```

## Test

```bash
npm test
```

## Features

- 12 full-screen slide sections with sidebar/header navigation
- Keyboard navigation via `ArrowUp` / `ArrowDown`
- Mock realtime WebSocket-like stream for metrics/log updates
- Live backend integration via `ws://localhost:8000/ws/status` and `/scan` + `/tunnel` calls, with mock fallback if backend is offline
- Mock API routes: `/api/scan`, `/api/tunnel`, `/api/logs`
- Live-like charts, threat map, React Flow agent pipeline, timeline, pricing, Gantt, gauges/progress
- QR code generation for demo links
- Accessibility support: semantic landmarks, alt labels, keyboard-focus styles, high contrast toggle
- Dark-mode-first UI with alert/safe color language for cybersecurity context

## Directory Tree

```text
frontend/
├── app/
│   ├── api/
│   │   ├── logs/route.ts
│   │   ├── scan/route.ts
│   │   └── tunnel/route.ts
│   ├── demo/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── charts/
│   │   ├── AgentFlow.tsx
│   │   └── HongKongThreatMap.tsx
│   ├── slides/
│   │   ├── Slide1.tsx ... Slide12.tsx
│   ├── ui/
│   │   ├── ErrorModal.tsx
│   │   ├── LoadingOverlay.tsx
│   │   ├── SlideSection.tsx
│   │   └── StatusPill.tsx
│   ├── FortressDeck.tsx
│   └── types.ts
├── data/mockData.ts
├── hooks/useMockRealtime.ts
├── lib/mockSocket.ts
├── __tests__/
│   ├── Slide1.test.tsx
│   ├── Slide6.test.tsx
│   └── StatusPill.test.tsx
├── jest.config.ts
├── jest.setup.ts
├── next.config.mjs
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```
