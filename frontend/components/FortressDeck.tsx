'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MoonStar, SunMedium } from 'lucide-react';
import { Slide1 } from '@/components/slides/Slide1';
import { Slide2 } from '@/components/slides/Slide2';
import { Slide3 } from '@/components/slides/Slide3';
import { Slide4 } from '@/components/slides/Slide4';
import { Slide5 } from '@/components/slides/Slide5';
import { Slide6 } from '@/components/slides/Slide6';
import { Slide7 } from '@/components/slides/Slide7';
import { Slide8 } from '@/components/slides/Slide8';
import { Slide9 } from '@/components/slides/Slide9';
import { Slide10 } from '@/components/slides/Slide10';
import { Slide11 } from '@/components/slides/Slide11';
import { Slide12 } from '@/components/slides/Slide12';
import type { SlideMeta } from '@/components/types';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { StatusPill } from '@/components/ui/StatusPill';
import { useMockRealtime } from '@/hooks/useMockRealtime';

const slides: SlideMeta[] = [
  { id: 'title', title: 'Title' },
  { id: 'crisis', title: 'Crisis' },
  { id: 'nightmare', title: 'Nightmare' },
  { id: 'agents', title: '4 Agents' },
  { id: 'tunnels', title: 'Tunnels' },
  { id: 'demo', title: 'Live Demo' },
  { id: 'architecture', title: 'Architecture' },
  { id: 'market', title: 'Market' },
  { id: 'metrics', title: 'Metrics' },
  { id: 'winner', title: 'Winner' },
  { id: 'ask', title: 'Ask' },
  { id: 'contact', title: 'Contact' },
];

export function FortressDeck() {
  const { metric, statusTone, connected } = useMockRealtime();
  const [activeSlide, setActiveSlide] = useState<SlideMeta['id']>('title');
  const [highContrast, setHighContrast] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.slide-panel'));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible?.target.id) {
          setActiveSlide(visible.target.id as SlideMeta['id']);
        }
      },
      { threshold: 0.6 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const index = slides.findIndex((slide) => slide.id === activeSlide);
      if (event.key === 'ArrowDown' && index < slides.length - 1) {
        document.getElementById(slides[index + 1].id)?.scrollIntoView({ behavior: 'smooth' });
      }
      if (event.key === 'ArrowUp' && index > 0) {
        document.getElementById(slides[index - 1].id)?.scrollIntoView({ behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSlide]);

  const className = useMemo(() => {
    const dark = lightMode ? 'bg-slate-100 text-slate-900' : 'bg-fortress-black text-white';
    return `${dark} ${highContrast ? 'contrast-[1.25]' : ''}`;
  }, [highContrast, lightMode]);

  return (
    <div className={className}>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-800/80 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">
              🛡️
            </span>
            <span className="font-display text-xl font-black tracking-widest">FORTRESSAI</span>
          </div>
          <nav aria-label="Slide navigation" className="hidden items-center gap-3 md:flex">
            {slides.map((slide) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => document.getElementById(slide.id)?.scrollIntoView({ behavior: 'smooth' })}
                className={`rounded px-2 py-1 text-xs ${activeSlide === slide.id ? 'bg-fortress-red/30 text-fortress-gold' : 'text-slate-300'}`}
              >
                {slide.title}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHighContrast((current) => !current)}
              className="rounded border border-slate-700 px-2 py-1 text-xs"
              aria-label="Toggle high contrast"
            >
              Contrast
            </button>
            <button
              type="button"
              onClick={() => setLightMode((current) => !current)}
              className="rounded border border-slate-700 p-1"
              aria-label="Toggle theme"
            >
              {lightMode ? <MoonStar size={16} /> : <SunMedium size={16} />}
            </button>
          </div>
        </div>
      </header>

      <main ref={containerRef} className="relative snap-y snap-mandatory overflow-y-auto">
        {loading && <LoadingOverlay label="Booting FortressAI visual simulation..." />}

        <div className="fixed right-4 top-20 z-40 rounded-xl border border-fortress-green/40 bg-black/70 p-3 backdrop-blur">
          <StatusPill status={metric?.status ?? 'ALERT'} />
          <p className={`mt-2 text-[10px] ${connected ? 'text-fortress-green' : 'text-fortress-gold'}`}>
            Feed: {connected ? 'Backend WebSocket' : 'Mock Fallback'}
          </p>
          <p className="mt-1 text-xs text-slate-300">Threats/min: {metric?.threatsPerMinute ?? '--'}</p>
          <p className="text-xs text-slate-300">Tunnel latency: {metric?.tunnelLatencyMs ?? '--'}ms</p>
          <p className={`text-xs font-semibold ${statusTone}`}>OWASP detect: {metric?.owaspDetection ?? '--'}%</p>
        </div>

        <Slide1 />
        <Slide2 />
        <Slide3 />
        <Slide4 />
        <Slide5 />
        <Slide6 onDemoComplete={() => setActiveSlide('demo')} />
        <Slide7 />
        <Slide8 />
        <Slide9 />
        <Slide10 />
        <Slide11 />
        <Slide12 />
      </main>

      <footer className="border-t border-slate-800 bg-black/80 px-4 py-4 text-center text-xs text-slate-400">
        Fortress Team | Hong Kong Hackathon 2026
      </footer>
    </div>
  );
}
