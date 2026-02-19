'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { marketGrowth, pricingTiers } from '@/data/mockData';
import { SlideSection } from '@/components/ui/SlideSection';

export function Slide8() {
  return (
    <SlideSection id="market" title="Hong Kong Market">
      <h2 className="text-3xl font-bold text-white">HONG KONG MARKET</h2>
      <p className="mt-2 text-slate-300">340K SMEs, rising digital dependence, and increasing cyber incidents demand affordable autonomous defense.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-fortress-gold/40 bg-black/30 p-4">
          <h3 className="font-semibold text-fortress-gold">Pricing</h3>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-slate-300">
                <th>Tier</th>
                <th>Price</th>
                <th>Features</th>
              </tr>
            </thead>
            <tbody>
              {pricingTiers.map((tier) => (
                <tr key={tier.tier} className="border-t border-slate-700 align-top">
                  <td className="py-2 font-semibold text-white">{tier.tier}</td>
                  <td className="py-2 text-fortress-green">{tier.price}</td>
                  <td className="py-2 text-slate-300">{tier.features}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="h-80 rounded-xl border border-fortress-green/30 bg-black/30 p-4">
          <h3 className="font-semibold text-fortress-green">ARR Trajectory ($M)</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={marketGrowth}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis dataKey="year" stroke="#e2e8f0" />
              <YAxis stroke="#e2e8f0" />
              <Tooltip />
              <Line type="monotone" dataKey="arr" stroke="#22C55E" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SlideSection>
  );
}
