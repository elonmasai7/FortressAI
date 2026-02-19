'use client';

import { motion } from 'framer-motion';
import { judgeRows } from '@/data/mockData';
import { SlideSection } from '@/components/ui/SlideSection';

export function Slide10() {
  return (
    <SlideSection id="winner" title="Judges Winner">
      <h2 className="text-3xl font-bold text-white">JUDGES: YOUR WINNER</h2>
      <div className="mt-6 rounded-xl border border-fortress-green/30 bg-black/30 p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-fortress-gold">
              <th>Criteria</th>
              <th>Delivery</th>
            </tr>
          </thead>
          <tbody>
            {judgeRows.map((row) => (
              <tr key={row.criteria} className="border-t border-slate-700">
                <td className="py-3 font-semibold text-white">{row.criteria}</td>
                <td className="py-3 text-slate-300">{row.delivery}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="relative mt-8 flex h-48 items-center justify-center overflow-hidden rounded-xl border border-fortress-green/30 bg-black/40">
        {Array.from({ length: 20 }).map((_, index) => (
          <motion.span
            key={`tick-${index}`}
            className="absolute text-2xl text-fortress-green"
            initial={{ y: -200, x: (index % 10) * 35 - 160 }}
            animate={{ y: 220 }}
            transition={{ duration: 2.2, repeat: Infinity, delay: index * 0.08 }}
          >
            ✓
          </motion.span>
        ))}
        <motion.div
          className="text-6xl"
          initial={{ scale: 0.4, rotate: -20 }}
          animate={{ scale: [0.4, 1.25, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.8 }}
        >
          🏆
        </motion.div>
      </div>
    </SlideSection>
  );
}
