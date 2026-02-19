'use client';

import { agentCards } from '@/data/mockData';
import { AgentFlow } from '@/components/charts/AgentFlow';
import { SlideSection } from '@/components/ui/SlideSection';

export function Slide4() {
  return (
    <SlideSection id="agents" title="FortressAI Agents">
      <h2 className="text-3xl font-bold text-white">FORTRESSAI: 4 Autonomous AI Agents</h2>
      <p className="mt-2 max-w-3xl text-slate-300">
        Pipeline: Recon -&gt; Simulate -&gt; Respond -&gt; Log. Incoming attacks auto-resolve and produce compliance evidence.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {agentCards.map((card) => (
          <article key={card.id} className="rounded-full border border-fortress-green/50 bg-black/40 p-5 text-center">
            <h3 className="font-semibold text-fortress-green">{card.title}</h3>
            <p className="mt-1 text-xs text-slate-300">{card.desc}</p>
          </article>
        ))}
      </div>

      <div className="mt-8">
        <AgentFlow />
      </div>
    </SlideSection>
  );
}
