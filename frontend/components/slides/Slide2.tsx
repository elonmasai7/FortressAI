'use client';

import dynamic from 'next/dynamic';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { crisisTable, recoveryComparison } from '@/data/mockData';
import { SlideSection } from '@/components/ui/SlideSection';

const DynamicMap = dynamic(() => import('@/components/charts/HongKongThreatMap').then((mod) => mod.HongKongThreatMap), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-xl bg-slate-900" />,
});

export function Slide2() {
  return (
    <SlideSection id="crisis" title="HK Cyber Crisis">
      <h2 className="text-3xl font-bold text-white md:text-4xl">Hong Kong SMEs Are Under Siege</h2>
      <p className="mt-3 max-w-3xl text-slate-300">Threats are rising faster than SME teams can detect, isolate, and recover from attacks.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-fortress-red/40 bg-black/40 p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-fortress-gold">
                <th className="pb-2">Metric</th>
                <th className="pb-2">2025</th>
                <th className="pb-2">YoY Change</th>
              </tr>
            </thead>
            <tbody>
              {crisisTable.map((row) => (
                <tr key={row.metric} className="border-t border-slate-800">
                  <td className="py-2">{row.metric}</td>
                  <td>{row.value2025}</td>
                  <td className="font-semibold text-fortress-red">{row.yoy}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 rounded-full bg-fortress-red/20 px-3 py-1 text-xs text-fortress-red">SMEs cannot afford $500K enterprise solutions.</p>
        </div>

        <DynamicMap />
      </div>

      <div className="mt-6 h-64 rounded-2xl border border-fortress-green/30 bg-black/30 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={recoveryComparison}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" stroke="#e2e8f0" />
            <YAxis stroke="#e2e8f0" />
            <Tooltip />
            <Bar dataKey="days" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <a href="#" className="mt-4 text-xs text-slate-400 underline">
        Source: Hong Kong Incident Digest 2025 (placeholder)
      </a>
    </SlideSection>
  );
}
