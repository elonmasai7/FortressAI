'use client';

import { Chart } from 'react-google-charts';
import { askPrizes, roadmapGantt } from '@/data/mockData';
import { SlideSection } from '@/components/ui/SlideSection';

export function Slide11() {
  return (
    <SlideSection id="ask" title="The Ask">
      <h2 className="text-3xl font-bold text-white">THE ASK</h2>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
        <ul className="space-y-3 rounded-xl border border-fortress-gold/40 bg-black/30 p-4 text-sm text-slate-200">
          {askPrizes.map((prize) => (
            <li key={prize}>{prize}</li>
          ))}
        </ul>

        <div className="rounded-xl border border-fortress-green/30 bg-black/30 p-4">
          <h3 className="text-sm font-semibold text-fortress-green">Roadmap</h3>
          <Chart
            chartType="Timeline"
            width="100%"
            height="260px"
            data={roadmapGantt}
            options={{
              backgroundColor: '#00000000',
              colors: ['#22C55E', '#E11D48', '#D4AF37', '#9CA3AF'],
            }}
          />
        </div>
      </div>
    </SlideSection>
  );
}
