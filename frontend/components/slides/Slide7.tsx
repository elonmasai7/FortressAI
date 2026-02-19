'use client';

import { SlideSection } from '@/components/ui/SlideSection';

const architecture = [
  'Next.js Dashboard -> FastAPI Gateway',
  'FastAPI -> Agent Queue (mocked)',
  'Respond Agent -> Tunnel Controller',
  'Log Agent -> Immutable Ledger',
  'Metrics Stream -> Judge Dashboard',
];

export function Slide7() {
  return (
    <SlideSection id="architecture" title="Technical Architecture">
      <h2 className="text-3xl font-bold text-white">TECHNICAL ARCHITECTURE</h2>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-fortress-gold/50 bg-black/30 p-4">
          <pre className="overflow-x-auto text-xs text-slate-200">
{`Next.js 14 Dashboard\n  |\n  +--> FastAPI (mock layer)\n        |\n        +--> Recon | Simulate | Respond | Log\n              |\n              +--> Postgres + Redis + AWS (placeholders)`}
          </pre>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {architecture.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-300">
          <p className="font-semibold text-fortress-gold">Mock Visual Assets</p>
          <div className="mt-4 rounded-lg border border-dashed border-slate-600 p-5 text-center">
            docker-compose.yml screenshot placeholder
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-slate-600 p-5 text-center">Cluster topology diagram placeholder</div>
        </div>
      </div>
    </SlideSection>
  );
}
