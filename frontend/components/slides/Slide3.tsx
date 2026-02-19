'use client';

import { motion } from 'framer-motion';
import { nightmarePoints } from '@/data/mockData';
import { SlideSection } from '@/components/ui/SlideSection';

const timeline = ['Attack T=0', 'Detection Fail', 'Lateral Spread', 'Data Exfiltration', 'Ransom Demand', 'Bankruptcy'];

export function Slide3() {
  return (
    <SlideSection id="nightmare" title="SME Nightmare">
      <h2 className="text-3xl font-bold text-white">SME Nightmare: Why Defenses Fail</h2>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ul className="space-y-3">
          {nightmarePoints.map((point) => (
            <li key={point.title} className="group rounded-xl border border-fortress-red/30 bg-black/30 p-4">
              <p className="font-semibold text-white">❌ {point.title}</p>
              <p className="mt-1 text-sm text-slate-300 transition group-hover:text-fortress-gold">{point.detail}</p>
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-fortress-red/40 bg-black/30 p-4">
          <div className="relative mt-8 h-20">
            <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-fortress-red/60" />
            <div className="absolute left-0 right-0 top-1/2 flex -translate-y-1/2 justify-between">
              {timeline.map((step, index) => (
                <motion.div
                  key={step}
                  initial={{ scale: 0.7, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.08 }}
                  className="w-[15%] text-center text-[10px] text-slate-200"
                >
                  <div className="mx-auto mb-2 h-6 w-6 rounded-full border border-fortress-red bg-fortress-red/20" />
                  {step}
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div
            className="mt-10 text-center text-5xl"
            animate={{ scale: [1, 1.1, 0.8, 1], opacity: [0.8, 1, 0.6, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            aria-label="Bankruptcy black hole"
          >
            🕳️
          </motion.div>
        </div>
      </div>
    </SlideSection>
  );
}
