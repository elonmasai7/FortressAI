'use client';

import { QRCodeSVG } from 'qrcode.react';
import { contacts } from '@/data/mockData';
import { SlideSection } from '@/components/ui/SlideSection';

export function Slide12() {
  return (
    <SlideSection id="contact" title="Get Involved">
      <h2 className="text-3xl font-bold text-white">GET INVOLVED</h2>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {contacts.map((contact) => (
          <article key={contact.email} className="rounded-xl border border-fortress-gold/40 bg-black/30 p-4 text-sm">
            <h3 className="font-semibold text-fortress-gold">{contact.name}</h3>
            <p className="mt-2 text-slate-200">{contact.email}</p>
            <p className="text-slate-300">{contact.website}</p>
            <p className="text-slate-300">{contact.phone}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <div className="rounded-2xl border border-fortress-green/40 bg-black/40 p-8 text-center">
          <QRCodeSVG value="http://localhost:3000/demo" size={260} fgColor="#22C55E" bgColor="transparent" />
          <p className="mt-4 text-sm text-slate-200">Scan to open LIVE DEMO</p>
        </div>
      </div>
    </SlideSection>
  );
}
