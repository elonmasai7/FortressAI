'use client';

import { motion } from 'framer-motion';
import { tunnelFeatures } from '@/data/mockData';
import { SlideSection } from '@/components/ui/SlideSection';

export function Slide5() {
  return (
    <SlideSection id="tunnels" title="ExpressVPN Tunnels">
      <h2 className="text-3xl font-bold text-white">🚀 3-SECOND ZERO-TRUST ISOLATION</h2>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <ul className="space-y-3 rounded-xl border border-fortress-gold/40 bg-black/30 p-4">
          {tunnelFeatures.map((feature) => (
            <li key={feature} className="text-sm text-slate-200">
              ✅ {feature}
            </li>
          ))}
        </ul>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-fortress-red/50 bg-fortress-red/10 p-4">
            <h3 className="font-semibold text-fortress-red">Before</h3>
            <p className="mt-2 text-sm text-slate-200">Exposed servers, phishing payloads, and unsegmented networks.</p>
            <p className="mt-4 text-xs text-fortress-red">Threats detected: 19</p>
          </div>
          <div className="rounded-xl border border-fortress-green/50 bg-fortress-green/10 p-4">
            <h3 className="font-semibold text-fortress-green">After</h3>
            <p className="mt-2 text-sm text-slate-200">Active tunnels, blocked ingress, and zero-trust segmentation.</p>
            <p className="mt-4 text-xs text-fortress-green">Threats blocked: 19</p>
          </div>
          <motion.div
            className="col-span-full rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-center text-sm text-slate-300"
            animate={{ backgroundColor: ['rgba(15,23,42,0.5)', 'rgba(34,197,94,0.15)', 'rgba(15,23,42,0.5)'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            Tunnel Deployment GIF Placeholder (animated simulation)
          </motion.div>
        </div>
      </div>
    </SlideSection>
  );
}
