import './globals.css';

export const metadata = {
  title: 'FortressAI Dashboard',
  description: '4-Agent Autonomous Cyber Defense for HK',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
