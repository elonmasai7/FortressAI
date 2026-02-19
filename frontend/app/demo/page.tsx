'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ShieldX, TerminalSquare } from 'lucide-react';
import { fetchJson, getWsBase } from '@/lib/backend';

type PhaseId = 'recon' | 'respond' | 'log';

type DemoPhase = {
  id: PhaseId;
  label: string;
  range: [number, number];
  tone: 'red' | 'yellow' | 'green';
};

type BackendStatusPayload = {
  traffic_rps?: number;
  blocked_rps?: number;
  bert_confidence?: number;
  tunnel_latency_ms?: number;
  tunnel_active?: boolean;
  kill_switch_on?: boolean;
  hyperledger_tx?: string;
};

type AttackRoute = {
  from: [number, number];
  fromLabel: string;
  to: [number, number];
  toLabel: string;
};

type DemoScenario = {
  id: string;
  name: string;
  short: string;
  incidents: number;
  attackPeak: number;
  bertTarget: number;
  reconAlert: string;
  responseAlert: string;
  solutionAlert: string;
  reconTerminal: string[];
  respondTerminal: string[];
  logTerminal: string[];
  routes: AttackRoute[];
};

const HongKongLiveAttackMap = dynamic(
  () => import('@/components/charts/HongKongLiveAttackMap').then((m) => m.HongKongLiveAttackMap),
  { ssr: false },
);

const TOTAL_SECONDS = 30;

const PHASES: DemoPhase[] = [
  { id: 'recon', label: 'ATTACK', range: [0, 10], tone: 'red' },
  { id: 'respond', label: 'RESPONSE', range: [11, 22], tone: 'yellow' },
  { id: 'log', label: 'SOLUTION', range: [23, 30], tone: 'green' },
];

const DEMOS: DemoScenario[] = [
  {
    id: 'bank-ddos',
    name: 'Demo 1',
    short: 'Banking DDoS + RDP',
    incidents: 15877,
    attackPeak: 520,
    bertTarget: 0.91,
    reconAlert: 'RDP Exposed: hkma.gov.hk:3389 - Botnet surge from West HK',
    responseAlert: 'SOC Mitigation: upstream filters + secure tunnel online',
    solutionAlert: 'Banking traffic stabilized. Core services fully protected',
    reconTerminal: [
      '$ nmap -sV hkma.gov.hk',
      '3389/tcp open  ms-wbt-server',
      'Vuln: CVE-2024-38112 | severity=critical',
    ],
    respondTerminal: [
      '$ fortressai mitigate --profile ddos-hk',
      '$ expressvpn connect hk',
      '[OK] ExpressVPN tunnel connected; ACL enforced',
    ],
    logTerminal: [
      '$ fortressai log --incident hkma-ddos-01',
      'Evidence bundle signed and stored',
    ],
    routes: [
      { from: [22.2619, 114.1304], fromLabel: 'Cyberport', to: [22.2819, 114.1589], toLabel: 'Central/HKMA' },
      { from: [22.3714, 114.1131], fromLabel: 'Tsuen Wan', to: [22.2819, 114.1589], toLabel: 'Central/HKMA' },
      { from: [22.3872, 114.1954], fromLabel: 'Sha Tin', to: [22.2819, 114.1589], toLabel: 'Central/HKMA' },
    ],
  },
  {
    id: 'gov-phish',
    name: 'Demo 2',
    short: 'Gov Phishing Wave',
    incidents: 14210,
    attackPeak: 500,
    bertTarget: 0.95,
    reconAlert: 'Phishing infra mapped across Kowloon and East HK endpoints',
    responseAlert: 'Mail gateway lockdown + user-risk segmentation enabled',
    solutionAlert: 'Phishing spread contained. Malicious campaigns neutralized',
    reconTerminal: [
      '$ fortressai recon --campaign hk-gov-template',
      'Known lure domains discovered: 9',
      'Credential harvest indicators flagged',
    ],
    respondTerminal: [
      '$ fortressai simulate --template hk_phish',
      '$ fortressai respond --playbook mail-shield',
      '[OK] ExpressVPN secured route + domain blocks active',
    ],
    logTerminal: [
      '$ fortressai log --compliance HKMA_2026',
      'Immutable mail-security report committed',
    ],
    routes: [
      { from: [22.3233, 114.2146], fromLabel: 'Kowloon Bay', to: [22.2819, 114.1589], toLabel: 'Central/HKMA' },
      { from: [22.2866, 114.2168], fromLabel: 'Quarry Bay', to: [22.2819, 114.1589], toLabel: 'Central/HKMA' },
      { from: [22.3077, 114.2594], fromLabel: 'Tseung Kwan O', to: [22.2819, 114.1589], toLabel: 'Central/HKMA' },
    ],
  },
  {
    id: 'ransom-move',
    name: 'Demo 3',
    short: 'Ransomware Lateral Move',
    incidents: 16702,
    attackPeak: 560,
    bertTarget: 0.88,
    reconAlert: 'Lateral movement detected from north-west clusters toward HK core',
    responseAlert: 'Network segmentation + kill switch activated in 3 seconds',
    solutionAlert: 'Ransomware chain broken. No production encryption observed',
    reconTerminal: [
      '$ fortressai recon --lateral east-west',
      'SMB pivot attempts detected on internal segments',
      'High-risk host behavior mapped',
    ],
    respondTerminal: [
      '$ expressvpn connect hk',
      '$ iptables -A FORWARD -j DROP',
      '[OK] ExpressVPN tunnel active; segment isolation complete',
    ],
    logTerminal: [
      '$ fortressai log --incident lateral-ransom-03',
      'Recovery checklist and audit trail finalized',
    ],
    routes: [
      { from: [22.3914, 113.9771], fromLabel: 'Tuen Mun', to: [22.2819, 114.1589], toLabel: 'Central/HKMA' },
      { from: [22.308, 113.9185], fromLabel: 'Airport', to: [22.2819, 114.1589], toLabel: 'Central/HKMA' },
      { from: [22.2803, 114.185], fromLabel: 'Causeway Bay', to: [22.2819, 114.1589], toLabel: 'Central/HKMA' },
    ],
  },
];

const toneClasses = {
  red: {
    border: 'border-red-500/45',
    glow: 'shadow-[0_0_44px_-18px_rgba(239,68,68,0.65)]',
    badge: 'bg-red-600/20 text-red-300 border-red-500/60',
    alert: 'bg-red-950/50 border-red-500/60 text-red-200',
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

const bertSeries = [
  { name: 'Email A', confidence: 0.31 },
  { name: 'Email B', confidence: 0.95 },
  { name: 'Email C', confidence: 0.66 },
  { name: 'Email D', confidence: 0.42 },
];

function getPhase(second: number): DemoPhase {
  return PHASES.find((p) => second >= p.range[0] && second <= p.range[1]) || PHASES[PHASES.length - 1];
}

function makeTrafficSeed() {
  return Array.from({ length: 24 }, (_, i) => ({ t: `${i}`, normal: 80, attack: 80, blocked: 0 }));
}

export default function DemoPage() {
  const [scenarioId, setScenarioId] = useState(DEMOS[0].id);
  const [second, setSecond] = useState(0);
  const [running, setRunning] = useState(true);
  const [connected, setConnected] = useState(false);
  const [terminal, setTerminal] = useState<string[]>([]);
  const [trafficData, setTrafficData] = useState<Array<{ t: string; normal: number; attack: number; blocked: number }>>(makeTrafficSeed());
  const [bertConfidence, setBertConfidence] = useState(0.12);
  const [tunnelLatency, setTunnelLatency] = useState(999);
  const [tunnelActive, setTunnelActive] = useState(false);
  const [killSwitch, setKillSwitch] = useState(false);
  const [hyperledgerTx, setHyperledgerTx] = useState('pending...');
  const socketRef = useRef<WebSocket | null>(null);

  const scenario = useMemo(() => DEMOS.find((demo) => demo.id === scenarioId) || DEMOS[0], [scenarioId]);
  const phase = getPhase(second);

  const safeIn3s = useMemo(() => phase.id === 'respond' && second >= 19, [phase.id, second]);

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
      // fallback mode keeps UI running
    }
  }, []);

  const resetDemo = useCallback(async () => {
    setSecond(0);
    setRunning(true);
    setTerminal([]);
    setTrafficData(makeTrafficSeed());
    setBertConfidence(0.12);
    setTunnelLatency(999);
    setTunnelActive(false);
    setKillSwitch(false);
    setHyperledgerTx('pending...');
    await runRestAction('/reset', { method: 'POST' });
  }, [runRestAction]);

  const switchScenario = useCallback(
    async (nextId: string) => {
      setScenarioId(nextId);
      await resetDemo();
    },
    [resetDemo],
  );

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
      addTerminalBlock(scenario.reconTerminal);
      runRestAction('/scan', { method: 'POST' });
    }
    if (phase.id === 'respond') {
      addTerminalBlock(scenario.respondTerminal);
      setBertConfidence(scenario.bertTarget);
      setTunnelLatency(50);
      setTunnelActive(true);
      setKillSwitch(true);
      runRestAction('/simulate', { method: 'POST' });
      runRestAction('/tunnel', { method: 'POST' });
    }
    if (phase.id === 'log') {
      addTerminalBlock(scenario.logTerminal);
      setHyperledgerTx(`0x${scenario.id.slice(0, 4)}123...logged`);
      runRestAction('/logs', { method: 'GET' });
    }
  }, [phase.id, scenario, addTerminalBlock, runRestAction]);

  useEffect(() => {
    if (connected) return;
    const timer = setInterval(() => {
      const attackValue = phase.id === 'recon' ? scenario.attackPeak * 0.82 + Math.random() * 90 : phase.id === 'respond' ? 120 + Math.random() * 45 : 72 + Math.random() * 20;
      const blockedValue = phase.id === 'respond' || phase.id === 'log' ? Math.min(scenario.attackPeak, attackValue - 30) : 0;
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
  }, [connected, phase.id, scenario.attackPeak]);

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
              <p className="mt-1 text-sm text-slate-300">Live Hong Kong Attack Simulation Dashboard</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone.badge}`}>{phase.label}</span>
              <span className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300">{second}s / 30s</span>
              <span className={`rounded-md border px-3 py-1 text-xs ${connected ? 'border-emerald-500/60 bg-emerald-600/20 text-emerald-200' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>
                WS: {connected ? 'CONNECTED' : 'MOCK'}
              </span>
              <button
                type="button"
                onClick={() => {
                  void resetDemo();
                }}
                className="rounded-md border border-emerald-500/60 bg-emerald-600/20 px-3 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-600/30"
              >
                Reset Demo
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {DEMOS.map((demo) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => {
                  void switchScenario(demo.id);
                }}
                className={`rounded-lg border px-3 py-2 text-left text-xs transition ${scenarioId === demo.id ? 'border-cyan-400 bg-cyan-500/15 text-cyan-200' : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'}`}
              >
                <p className="font-semibold">{demo.name}</p>
                <p>{demo.short}</p>
              </button>
            ))}
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
                  <motion.p key="recon-alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 animate-pulse text-lg font-bold">
                    {scenario.reconAlert}
                  </motion.p>
                ) : phase.id === 'respond' ? (
                  <motion.p key="resp-alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 text-lg font-bold">
                    {scenario.responseAlert}
                  </motion.p>
                ) : (
                  <motion.p key="log-alert" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2 text-lg font-bold">
                    {scenario.solutionAlert}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <div className="rounded-2xl border border-red-500/35 bg-slate-950/70 p-4">
              <p className="text-xs uppercase text-slate-400">Hong Kong Live Attack Map</p>
              <div className="mt-2">
                <HongKongLiveAttackMap phase={phase.id} second={second} routes={scenario.routes} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <p className="text-xs text-slate-400">Incidents</p>
                <p className="mt-1 text-xl font-bold text-red-300">{scenario.incidents.toLocaleString()}</p>
                <p className="text-xs text-slate-500">HK threat context</p>
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
                <span>Attack Graph: Normal traffic -&gt; live attack spike -&gt; blocked traffic</span>
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
                  <li>1. Detect: confirm exposed service and validate active indicators.</li>
                  <li>2. Contain: deploy secure tunnel, enforce ACL and kill switch.</li>
                  <li>3. Recover: verify traffic baseline and service health in all zones.</li>
                  <li>4. Record: log immutable compliance proof for audit.</li>
                </ul>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
