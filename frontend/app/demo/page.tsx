'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ShieldX, TerminalSquare } from 'lucide-react';
import { fetchJson, getWsBase } from '@/lib/backend';

type PhaseId = 'recon' | 'simulate' | 'respond' | 'log';

type DemoPhase = {
  id: PhaseId;
  label: string;
  range: [number, number];
  tone: 'red' | 'orange' | 'yellow' | 'green';
};

type BackendStatusPayload = {
  ts?: string;
  phase?: PhaseId;
  threat_level?: 'CRITICAL' | 'HIGH' | 'SAFE';
  traffic_rps?: number;
  blocked_rps?: number;
  bert_confidence?: number;
  tunnel_latency_ms?: number;
  tunnel_active?: boolean;
  kill_switch_on?: boolean;
  hyperledger_tx?: string;
};

const TOTAL_SECONDS = 30;

const PHASES: DemoPhase[] = [
  { id: 'recon', label: 'ATTACK', range: [0, 10], tone: 'red' },
  { id: 'respond', label: 'RESPONSE', range: [11, 22], tone: 'yellow' },
  { id: 'log', label: 'SOLUTION', range: [23, 30], tone: 'green' },
];

const toneClasses = {
  red: {
    border: 'border-red-500/45',
    glow: 'shadow-[0_0_44px_-18px_rgba(239,68,68,0.65)]',
    badge: 'bg-red-600/20 text-red-300 border-red-500/60',
    alert: 'bg-red-950/50 border-red-500/60 text-red-200',
  },
  orange: {
    border: 'border-orange-500/45',
    glow: 'shadow-[0_0_44px_-18px_rgba(249,115,22,0.58)]',
    badge: 'bg-orange-600/20 text-orange-300 border-orange-500/60',
    alert: 'bg-orange-950/50 border-orange-500/60 text-orange-200',
  },
  yellow: {
    border: 'border-yellow-400/45',
    glow: 'shadow-[0_0_44px_-18px_rgba(250,204,21,0.54)]',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/60',
    alert: 'bg-yellow-950/45 border-yellow-400/60 text-yellow-100',
  },
  green: {
    border: 'border-emerald-500/45',
    glow: 'shadow-[0_0_44px_-18px_rgba(16,185,129,0.62)]',
    badge: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/60',
    alert: 'bg-emerald-950/50 border-emerald-500/60 text-emerald-100',
  },
};

const reconTerminal = [
  '$ nmap -sV hkma.gov.hk',
  'Starting Nmap 7.95 at 2026-04-13',
  '3389/tcp open  ms-wbt-server Microsoft Terminal Services',
  'Vuln: CVE-2024-38112 detected | risk=critical',
];

const simulateTerminal = [
  '$ fortressai simulate --template hk_phish',
  'Loading Hong Kong gov phishing corpus...',
  'Classifier verdict: 95% match to known template',
  'Outbound campaign emulation rate: 500rps',
];

const respondTerminal = [
  '$ wg-quick up fortress-tunnel',
  '[OK] Interface fortress-tunnel activated',
  '[OK] ACL enforced: HKMA production allow-list',
  '[OK] Traffic sinkholed and blocked',
];

const logTerminal = [
  '$ fortressai log --immutable --hkma',
  'Hyperledger anchor broadcast pending...',
  'tx: 0xabc123def4567890feaa001122334455',
  'Compliance package sealed (100% HKMA Compliant)',
];

const bertSeries = [
  { name: 'Email A', confidence: 0.31 },
  { name: 'Email B', confidence: 0.95 },
  { name: 'Email C', confidence: 0.66 },
  { name: 'Email D', confidence: 0.42 },
];

function getPhase(second: number): DemoPhase {
  return PHASES.find((p) => second >= p.range[0] && second <= p.range[1]) || PHASES[PHASES.length - 1];
}

export default function DemoPage() {
  const [second, setSecond] = useState(0);
  const [running, setRunning] = useState(true);
  const [connected, setConnected] = useState(false);
  const [terminal, setTerminal] = useState<string[]>([]);
  const [incidents] = useState(15877);
  const [trafficData, setTrafficData] = useState<Array<{ t: string; normal: number; attack: number; blocked: number }>>(
    Array.from({ length: 24 }, (_, i) => ({ t: `${i}`, normal: 80, attack: 80, blocked: 0 }))
  );
  const [bertConfidence, setBertConfidence] = useState(0.12);
  const [tunnelLatency, setTunnelLatency] = useState(999);
  const [tunnelActive, setTunnelActive] = useState(false);
  const [killSwitch, setKillSwitch] = useState(false);
  const [hyperledgerTx, setHyperledgerTx] = useState('pending...');
  const socketRef = useRef<WebSocket | null>(null);
  const phase = getPhase(second);

  const safeIn3s = useMemo(() => {
    if (phase.id !== 'respond') return false;
    return second >= 19;
  }, [phase.id, second]);

  const addTerminalBlock = useCallback((lines: string[]) => {
    setTerminal((current) => [...current, ...lines].slice(-18));
  }, []);

  const syncFromBackend = useCallback((payload: BackendStatusPayload) => {
    if (typeof payload.traffic_rps === 'number') {
      const trafficRps = payload.traffic_rps;
      setTrafficData((current) => [
        ...current.slice(1),
        {
          t: new Date().toLocaleTimeString('en-HK', { minute: '2-digit', second: '2-digit' }),
          normal: 80,
          attack: Math.max(80, Math.round(trafficRps)),
          blocked: Math.max(0, Math.round(payload.blocked_rps ?? 0)),
        },
      ]);
    }
    if (typeof payload.bert_confidence === 'number') setBertConfidence(payload.bert_confidence);
    if (typeof payload.tunnel_latency_ms === 'number') setTunnelLatency(payload.tunnel_latency_ms);
    if (typeof payload.tunnel_active === 'boolean') setTunnelActive(payload.tunnel_active);
    if (typeof payload.kill_switch_on === 'boolean') setKillSwitch(payload.kill_switch_on);
    if (payload.hyperledger_tx) setHyperledgerTx(payload.hyperledger_tx);
  }, []);

  const runRestAction = useCallback(async (path: string, init?: RequestInit) => {
    try {
      await fetchJson(path, init);
    } catch {
      // keep demo running with fallback visuals
    }
  }, []);

  const resetDemo = useCallback(async () => {
    setSecond(0);
    setRunning(true);
    setTerminal([]);
    setTrafficData(Array.from({ length: 24 }, (_, i) => ({ t: `${i}`, normal: 80, attack: 80, blocked: 0 })));
    setBertConfidence(0.12);
    setTunnelLatency(999);
    setTunnelActive(false);
    setKillSwitch(false);
    setHyperledgerTx('pending...');
    await runRestAction('/reset', { method: 'POST' });
  }, [runRestAction]);

  useEffect(() => {
    const wsUrl = `${getWsBase()}/ws/status`;
    let timeout: NodeJS.Timeout | null = null;

    try {
      socketRef.current = new WebSocket(wsUrl);
      socketRef.current.onopen = () => setConnected(true);
      socketRef.current.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as BackendStatusPayload;
          syncFromBackend(payload);
        } catch {
          // ignore malformed payload
        }
      };
      socketRef.current.onerror = () => setConnected(false);
      socketRef.current.onclose = () => setConnected(false);
      timeout = setTimeout(() => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) setConnected(false);
      }, 1800);
    } catch {
      setConnected(false);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
      if (socketRef.current && socketRef.current.readyState < WebSocket.CLOSING) {
        socketRef.current.close();
      }
    };
  }, [syncFromBackend]);

  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => {
      setSecond((current) => {
        if (current >= TOTAL_SECONDS) {
          setRunning(false);
          return TOTAL_SECONDS;
        }
        return current + 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [running]);

  useEffect(() => {
    if (phase.id === 'recon') {
      addTerminalBlock(reconTerminal);
      runRestAction('/scan', { method: 'POST' });
    }
    if (phase.id === 'respond') {
      addTerminalBlock(respondTerminal);
      setBertConfidence(0.95);
      setTunnelLatency(50);
      setTunnelActive(true);
      setKillSwitch(true);
      runRestAction('/simulate', { method: 'POST' });
      runRestAction('/tunnel', { method: 'POST' });
    }
    if (phase.id === 'log') {
      addTerminalBlock(logTerminal);
      setHyperledgerTx('0xabc123...logged');
      runRestAction('/logs', { method: 'GET' });
    }
  }, [phase.id, addTerminalBlock, runRestAction]);

  useEffect(() => {
    if (connected) return;
    const timer = setInterval(() => {
      const attackValue = phase.id === 'recon' ? 400 + Math.random() * 120 : phase.id === 'respond' ? 120 + Math.random() * 45 : 72 + Math.random() * 20;
      const blockedValue = phase.id === 'respond' || phase.id === 'log' ? Math.min(500, attackValue - 30) : 0;
      setTrafficData((current) => [
        ...current.slice(1),
        {
          t: new Date().toLocaleTimeString('en-HK', { minute: '2-digit', second: '2-digit' }),
          normal: 80,
          attack: Math.round(attackValue),
          blocked: Math.round(blockedValue),
        },
      ]);
    }, 1200);

    return () => clearInterval(timer);
  }, [connected, phase.id]);

  const progress = Math.round((second / TOTAL_SECONDS) * 100);
  const threatLevel = phase.id === 'recon' ? 'CRITICAL' : phase.id === 'respond' ? (safeIn3s ? 'STABILIZING' : 'HIGH') : 'SAFE';
  const tone = toneClasses[phase.tone];

  return (
    <main className="min-h-screen bg-black text-slate-100">
      <div className="mx-auto max-w-[1500px] p-4 md:p-6">
        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border bg-slate-950/75 p-4 ${tone.border} ${tone.glow}`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-wide">🛡️ FORTRESSAI | Threat Level: {threatLevel}</h1>
              <p className="mt-1 text-sm text-slate-300">Hong Kong Hackathon 2026 - Slide 6 Live Demo</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone.badge}`}>{phase.label}</span>
              <span className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300">{second}s / 30s</span>
              <span className={`rounded-md border px-3 py-1 text-xs ${connected ? 'border-emerald-500/60 bg-emerald-600/20 text-emerald-200' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>
                WS: {connected ? 'CONNECTED' : 'MOCK'}
              </span>
              <button
                type="button"
                onClick={resetDemo}
                className="rounded-md border border-emerald-500/60 bg-emerald-600/20 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-600/30"
              >
                Reset Demo
              </button>
            </div>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <motion.div className="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500" animate={{ width: `${progress}%` }} />
          </div>
        </motion.header>

        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
          <section className="space-y-4 xl:col-span-3">
            <div className={`rounded-2xl border p-4 ${tone.alert}`}>
              <p className="text-xs uppercase tracking-[0.18em]">Live Alert</p>
              <AnimatePresence mode="wait">
                {phase.id === 'recon' ? (
                  <motion.p
                    key="recon-alert"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 animate-pulse text-lg font-bold"
                  >
                    RDP Exposed: hkma.gov.hk:3389 🚨
                  </motion.p>
                ) : phase.id === 'respond' ? (
                  <motion.p key="resp-alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 text-lg font-bold">
                    🚀 ExpressVPN Tunnel Deployed - {Math.max(0, 19 - second)}s
                  </motion.p>
                ) : (
                  <motion.p key="log-alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 text-lg font-bold">
                    100% HKMA Compliant
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="rounded-2xl border border-red-500/35 bg-slate-950/70 p-4">
              <p className="text-xs uppercase text-slate-400">HK Map</p>
              <div className="mt-2 h-52 overflow-hidden rounded-xl border border-slate-800 bg-black">
                <svg viewBox="0 0 420 250" className="h-full w-full">
                  <rect width="420" height="250" fill="#020617" />
                  <text x="56" y="196" fill="#f87171" fontSize="13">Cyberport</text>
                  <text x="282" y="90" fill="#f87171" fontSize="13">Kowloon</text>
                  <circle cx="86" cy="180" r="7" fill="#dc2626" />
                  <circle cx="314" cy="74" r="7" fill="#dc2626" />
                  <motion.path
                    d="M86 180 C 170 120, 220 120, 314 74"
                    stroke="#ef4444"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray="10 10"
                    animate={{ strokeDashoffset: [0, -26] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                  />
                  {phase.id === 'recon' && (
                    <motion.circle
                      cx="314"
                      cy="74"
                      r="18"
                      stroke="#f43f5e"
                      strokeWidth="2"
                      fill="transparent"
                      animate={{ scale: [0.8, 1.7], opacity: [0.95, 0] }}
                      transition={{ duration: 1.1, repeat: Infinity }}
                    />
                  )}
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <p className="text-xs text-slate-400">HKPC 2025</p>
                <p className="mt-1 text-xl font-bold text-red-300">{incidents.toLocaleString()}</p>
                <p className="text-xs text-slate-500">incidents</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <p className="text-xs text-slate-400">Latency</p>
                <p className="mt-1 text-xl font-bold text-cyan-300">{tunnelLatency}ms</p>
                <p className="text-xs text-slate-500">live</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 xl:col-span-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-orange-300" />
                <span>Attack Graph: Normal traffic -&gt; Phishing flood (500rps)</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="t" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ background: '#020617', border: '1px solid #334155' }} />
                    <Line type="monotone" dataKey="normal" stroke="#64748b" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="attack" stroke="#ef4444" dot={false} strokeWidth={3} />
                    <Line type="monotone" dataKey="blocked" stroke="#10b981" dot={false} strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4">
                <p className="text-sm text-slate-300">BERT confidence</p>
                <p className="mt-1 text-xl font-semibold text-orange-300">{bertConfidence.toFixed(2)}</p>
                <div className="mt-3 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bertSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis domain={[0, 1]} stroke="#64748b" />
                      <Tooltip contentStyle={{ background: '#020617', border: '1px solid #334155' }} />
                      <Bar dataKey="confidence" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4">
                <p className="text-sm text-slate-300">Respond Agent live metrics</p>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/60 p-2">
                    <span>Tunnel active</span>
                    {tunnelActive ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <ShieldX className="h-4 w-4 text-red-400" />}
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/60 p-2">
                    <span>Kill switch</span>
                    {killSwitch ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <ShieldX className="h-4 w-4 text-red-400" />}
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-900/60 p-2">
                    <span>Target latency</span>
                    <span className="font-semibold text-cyan-300">50ms</span>
                  </div>
                  <div className="rounded-md border border-emerald-500/50 bg-emerald-950/40 p-2 text-emerald-200">
                    {safeIn3s ? 'Threat neutralized in 3s ✓' : 'Mitigation in progress...'}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4">
              <p className="text-sm text-slate-300">Phase timeline</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {PHASES.map((p) => {
                  const active = phase.id === p.id;
                  const done = second > p.range[1];
                  return (
                    <div key={p.id} className={`rounded-lg border p-2 text-xs ${active ? 'border-cyan-400 bg-cyan-500/15' : done ? 'border-emerald-500/50 bg-emerald-600/10' : 'border-slate-700 bg-slate-900/50'}`}>
                      <p className="font-semibold">{p.label}</p>
                      <p className="text-slate-400">{p.range[0]}-{p.range[1]}s</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-4 xl:col-span-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm">
                <TerminalSquare className="h-4 w-4 text-emerald-300" />
                <span>Live Terminal</span>
              </div>
              <div className="h-64 overflow-auto rounded-lg bg-black p-2 font-mono text-xs text-emerald-300">
                {terminal.map((line, i) => (
                  <p key={`${line}-${i}`} className="leading-6">
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-4">
              <p className="text-sm text-slate-300">Immutable evidence</p>
              <p className="mt-2 rounded-md border border-emerald-500/50 bg-emerald-950/40 p-2 font-mono text-xs text-emerald-200">Hyperledger tx: {hyperledgerTx}</p>
              <p className="mt-3 rounded-md border border-emerald-500/50 bg-emerald-950/30 p-2 text-sm font-semibold text-emerald-200">Final Stats: Threat neutralized in 3s ✓ 0$ damage</p>
            </div>

            {phase.id === 'log' && (
              <div className="rounded-2xl border border-emerald-500/50 bg-slate-950/75 p-4">
                <p className="text-sm font-semibold text-emerald-300">Training Handbook</p>
                <ul className="mt-3 space-y-2 text-xs text-slate-200">
                  <li>1. Detect: Confirm exposed service and validate CVE evidence.</li>
                  <li>2. Contain: Bring up secure tunnel and enforce ACL + kill switch.</li>
                  <li>3. Recover: Verify safe traffic baseline and service health.</li>
                  <li>4. Record: Log immutable compliance proof for audit.</li>
                </ul>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
