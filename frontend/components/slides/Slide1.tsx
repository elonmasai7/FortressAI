'use client';

import { motion } from 'framer-motion';
import { SlideSection } from '@/components/ui/SlideSection';

export function Slide1() {
  return (
    <SlideSection id="title" title="Title Slide">
      <div className="grid flex-1 grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_2fr_1fr]">
        <div className="mx-auto h-40 w-40 rounded-full bg-metallic p-1">
          <div className="flex h-full items-center justify-center rounded-full border border-white/25 bg-black text-5xl" aria-label="Fortress Shield">
            🛡️
          </div>
        </div>

        <div className="text-center">
          <motion.h1
            className="text-5xl font-black tracking-[0.2em] text-white md:text-7xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            FORTRESSAI
          </motion.h1>
          <p className="mt-4 text-xl text-fortress-gold md:text-2xl">Autonomous AI Cybersecurity for Hong Kong SMEs</p>
          <motion.p
            className="mt-8 text-2xl font-bold text-fortress-red md:text-4xl"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            15,877 cyber attacks hit Hong Kong in 2025
          </motion.p>
          <motion.p
            className="mt-6 text-2xl font-extrabold text-fortress-green md:text-4xl"
            animate={{ opacity: [0.5, 1, 0.6], textShadow: ['0 0 0px #22C55E', '0 0 20px #22C55E', '0 0 6px #22C55E'] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ⚡ We stop them in 3 seconds
          </motion.p>
          <p className="mt-12 text-sm text-slate-300">Fortress Team | Hong Kong Hackathon 2026</p>
        </div>

        <div className="mx-auto flex h-40 w-40 items-center justify-center text-8xl" role="img" aria-label="Hong Kong flag">
          🇭🇰
        </div>
      </div>
    </SlideSection>
  );
}
