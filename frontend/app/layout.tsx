import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FortressAI UI Dashboard',
  description: 'UI-only cybersecurity pitch deck for Hong Kong Hackathon 2026',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
