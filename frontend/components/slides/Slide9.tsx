'use client';

import { QRCodeSVG } from 'qrcode.react';
import { winningMetrics } from '@/data/mockData';
import { SlideSection } from '@/components/ui/SlideSection';

export function Slide9() {
  return (
    <SlideSection id="metrics" title="Hackathon Metrics">
      <h2 className="text-3xl font-bold text-white">HACKATHON-WINNING METRICS</h2>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4 rounded-xl border border-fortress-green/30 bg-black/30 p-4">
          {winningMetrics.map((metric) => (
            <div key={metric.label}>
              <p className="text-sm text-slate-100">✅ {metric.label}</p>
              <div className="mt-1 h-3 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-fortress-green" style={{ width: `${metric.value}%` }} />
              </div>
            </div>
          ))}
          <div className="mt-4 rounded-lg border border-dashed border-slate-700 p-4 text-center text-xs text-slate-400">
            Dashboard screenshot + HKPC validation logo placeholder
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-fortress-gold/40 bg-black/30 p-6">
          <QRCodeSVG value="http://localhost:3000/demo" size={190} fgColor="#D4AF37" bgColor="transparent" />
          <p className="mt-4 text-center text-sm text-slate-300">LIVE MVP RUNNING</p>
        </div>
      </div>
    </SlideSection>
  );
}
