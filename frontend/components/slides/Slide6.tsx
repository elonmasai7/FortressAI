'use client';

import { useEffect, useState } from 'react';
import { demoSteps } from '@/data/mockData';
import { SlideSection } from '@/components/ui/SlideSection';
import { fetchJson } from '@/lib/backend';

type Slide6Props = {
  onDemoComplete: () => void;
};

export function Slide6({ onDemoComplete }: Slide6Props) {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [apiStatus, setApiStatus] = useState('Idle');
  const [threat, setThreat] = useState('RDP brute-force in progress on hkma.gov.hk:3389');
  const [responseAction, setResponseAction] = useState('Awaiting containment action');
  const [solution, setSolution] = useState('SAFE state pending');

  useEffect(() => {
    if (!running) {
      return;
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(100, prev + 4);
        setActiveStep(Math.min(demoSteps.length - 1, Math.floor((next / 100) * demoSteps.length)));
        if (next === 100) {
          setRunning(false);
          onDemoComplete();
        }
        return next;
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [onDemoComplete, running]);

  const runDemo = async () => {
    setProgress(0);
    setActiveStep(0);
    setRunning(true);
    setThreat('RDP brute-force in progress on hkma.gov.hk:3389');
    setResponseAction('Launching Respond Agent...');
    setSolution('SAFE state pending');
    setApiStatus('Executing live response sequence...');

    try {
      const result = await fetchJson<{
        status: string;
        timeline: Array<{ step: string; message: string }>;
        respond?: { mode?: string; latency_ms?: number };
        log?: { tx_hash?: string };
      }>('/demo');
      const respondMode = result.respond?.mode ?? 'unknown';
      const respondLatency = result.respond?.latency_ms ?? 3000;
      const txHash = result.log?.tx_hash ?? '0xabc';
      const responseText = `Respond Agent: ExpressVPN ${respondMode} mode, tunnel in ${respondLatency}ms`;
      setResponseAction(responseText);
      setSolution(`Safe dashboard switches to green; threat isolated, kill switch active, immutable log ${txHash}`);
      setApiStatus('Connected to backend API');
    } catch (_err) {
      try {
        await fetch('/api/scan', { method: 'POST' });
        await fetch('/api/tunnel', { method: 'POST' });
        setResponseAction('Respond Agent: fallback tunnel policy applied');
        setSolution('Solution: SAFE state simulated locally');
        setApiStatus('Backend unavailable. Using local mock API');
      } catch {
        setApiStatus('API unavailable');
        setResponseAction('Response action failed');
        setSolution('Solution unavailable - retry simulation');
      }
    }
  };

  return (
    <SlideSection id="demo" title="Live Hackathon Demo">
      <h2 className="text-3xl font-bold text-white">REAL ATTACK SIMULATION</h2>
      <p className="mt-2 text-slate-300">Single-click flow from live response action to final SAFE solution state.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-xl border border-fortress-green/30 bg-black/30 p-4">
          <div className="mb-4 rounded-lg border border-fortress-red/50 bg-fortress-red/10 p-3">
            <p className="text-xs uppercase tracking-wide text-fortress-gold">Attack</p>
            <p className="mt-1 text-sm text-white">{threat}</p>
          </div>
          <div className="mb-4 rounded-lg border border-fortress-green/40 bg-fortress-green/10 p-3">
            <p className="text-xs uppercase tracking-wide text-fortress-gold">Response Action</p>
            <p className="mt-1 text-sm text-white">{responseAction}</p>
          </div>
          <div className="mb-5 rounded-lg border border-fortress-gold/40 bg-fortress-gold/10 p-3">
            <p className="text-xs uppercase tracking-wide text-fortress-gold">Solution</p>
            <p className="mt-1 text-sm text-white">{solution}</p>
          </div>
          <ol className="space-y-2 text-sm text-slate-200">
            {demoSteps.map((step, index) => (
              <li key={step} className={index === activeStep ? 'text-fortress-green' : ''}>
                {index + 1}. {step}
              </li>
            ))}
          </ol>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-fortress-green transition-all" style={{ width: `${progress}%` }} />
          </div>
          <button
            type="button"
            onClick={runDemo}
            className="mt-5 rounded-lg border border-fortress-green bg-fortress-green/20 px-4 py-2 text-sm font-semibold"
          >
            Simulate 30s Demo
          </button>
          <p className="mt-4 text-xs text-slate-400">Response action is executed first, then final solution status is shown.</p>
          <p className="mt-1 text-xs text-fortress-gold">{apiStatus}</p>
        </div>

        <div className="rounded-xl border border-fortress-gold/40 bg-black/30 p-6">
          <p className="text-xs uppercase tracking-wide text-fortress-gold">Response to Solution Pipeline</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
              <p className="font-semibold text-fortress-green">1. Contain</p>
              <p className="text-slate-300">Respond Agent deploys tunnel and kill switch immediately.</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
              <p className="font-semibold text-fortress-green">2. Stabilize</p>
              <p className="text-slate-300">Threat traffic is isolated to protected route.</p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
              <p className="font-semibold text-fortress-green">3. Prove</p>
              <p className="text-slate-300">Log Agent writes immutable HKMA compliance evidence.</p>
            </div>
            <div className="rounded-lg border border-fortress-green/50 bg-fortress-green/10 p-3">
              <p className="font-semibold text-fortress-green">4. Solution</p>
              <p className="text-slate-100">Dashboard reaches SAFE state with audit trail.</p>
            </div>
          </div>
        </div>
      </div>
    </SlideSection>
  );
}
