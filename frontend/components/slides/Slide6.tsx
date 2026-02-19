'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { demoSteps } from '@/data/mockData';
import { ErrorModal } from '@/components/ui/ErrorModal';
import { SlideSection } from '@/components/ui/SlideSection';

type Slide6Props = {
  onDemoComplete: () => void;
};

export function Slide6({ onDemoComplete }: Slide6Props) {
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [showError, setShowError] = useState(false);
  const [apiStatus, setApiStatus] = useState('Idle');

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
    setApiStatus('Running mock scan...');

    try {
      await fetch('/api/scan');
      setApiStatus('Deploying mock tunnel...');
      await fetch('/api/tunnel', { method: 'POST' });
      setApiStatus('Demo sequence active');
    } catch {
      setApiStatus('Mock API unavailable');
    }

    if (Math.random() < 0.05) {
      setShowError(true);
      setRunning(false);
    }
  };

  return (
    <SlideSection id="demo" title="Live Hackathon Demo">
      <h2 className="text-3xl font-bold text-white">LIVE HACKATHON DEMO</h2>
      <p className="mt-2 text-slate-300">30-second autonomous sequence from recon to safe-state isolation.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-fortress-green/30 bg-black/30 p-4">
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
          <p className="mt-4 text-xs text-slate-400">SAFE dashboard switches to green at completion.</p>
          <p className="mt-1 text-xs text-fortress-gold">{apiStatus}</p>
        </div>

        <div className="flex flex-col items-center rounded-xl border border-fortress-gold/40 bg-black/30 p-6">
          <QRCodeSVG value="http://localhost:3000/demo" size={180} fgColor="#D4AF37" bgColor="transparent" />
          <p className="mt-4 text-center text-sm text-slate-300">Scan for mock demo page</p>
          <div className="mt-5 h-32 w-full rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-center text-xs text-slate-400">
            Realtime metrics screenshot placeholder
          </div>
        </div>
      </div>

      <ErrorModal
        open={showError}
        title="Simulation Notice"
        message="No threats detected in this cycle. Re-run scan to populate active incidents."
        onClose={() => setShowError(false)}
      />
    </SlideSection>
  );
}
