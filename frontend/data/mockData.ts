export type ThreatMetric = {
  threatsPerMinute: number;
  tunnelLatencyMs: number;
  blockedThreats: number;
  owaspDetection: number;
  autoResolved: number;
  status: 'SAFE' | 'ALERT';
};

export type LogLine = {
  id: string;
  timestamp: string;
  source: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL';
  message: string;
};

export const initialMetric: ThreatMetric = {
  threatsPerMinute: 238,
  tunnelLatencyMs: 2890,
  blockedThreats: 14840,
  owaspDetection: 95,
  autoResolved: 82,
  status: 'ALERT',
};

export const crisisTable = [
  { metric: 'Total Incidents', value2025: '15,877', yoy: '+27%' },
  { metric: 'SME Avg Recovery Time', value2025: '300+ days', yoy: '+19%' },
  { metric: 'Enterprise Recovery Time', value2025: '30 days', yoy: '-4%' },
  { metric: 'Avg Loss per Breach', value2025: '$500,000', yoy: '+21%' },
];

export const hkSpikes = [
  { name: 'Cyberport', position: [22.2612, 114.1306] as [number, number], count: 46 },
  { name: 'Kowloon', position: [22.3186, 114.1789] as [number, number], count: 63 },
  { name: 'HK Island', position: [22.2793, 114.1628] as [number, number], count: 71 },
];

export const recoveryComparison = [
  { name: 'SME', days: 320, fill: '#E11D48' },
  { name: 'Enterprise', days: 30, fill: '#22C55E' },
];

export const nightmarePoints = [
  { title: 'No 24/7 SOC', detail: 'Costs around $1.2M/year for continuous monitoring.' },
  { title: 'Legacy Devices', detail: 'Unpatched OT and POS devices expose old CVEs.' },
  { title: 'Weak Incident Playbooks', detail: 'Manual decisions create 6-12 hour response delays.' },
  { title: 'Compliance Blind Spots', detail: 'No immutable logs for HKMA-grade reporting.' },
];

export const agentCards = [
  { id: 'recon', title: 'Recon Agent', desc: 'nmap + Shodan asset intelligence.' },
  { id: 'simulate', title: 'Simulate Agent', desc: 'Threat emulation and exploit pathing.' },
  { id: 'respond', title: 'Respond Agent', desc: 'Auto isolation with 3-second tunnel deploy.' },
  { id: 'log', title: 'Log Agent', desc: 'Immutable HKMA-compliant evidence trails.' },
];

export const tunnelFeatures = [
  'WireGuard kill switch always-on',
  'Hong Kong relay routing for low latency',
  'Zero-trust micro-segmentation profile',
  'Instant policy rollback and forensic trace',
];

export const demoSteps = [
  'Recon scans exposed attack surface',
  'Simulation validates exploit pattern',
  'Response deploys ExpressVPN tunnel',
  'Log agent records immutable trail',
  'Dashboard flips to SAFE state',
];

export const marketGrowth = [
  { year: 'Year 1', arr: 2 },
  { year: 'Year 2', arr: 15 },
  { year: 'Year 3', arr: 50 },
];

export const pricingTiers = [
  { tier: 'Essentials', price: '$49/mo', features: 'Endpoint scans, playbooks, weekly reports' },
  { tier: 'Growth', price: '$149/mo', features: 'Realtime monitoring, tunnel orchestration, API alerts' },
  { tier: 'Enterprise', price: '$499/mo', features: 'Dedicated SOC handoff, custom policies, SLA support' },
];

export const winningMetrics = [
  { label: 'OWASP Top 10 Detection', value: 95 },
  { label: 'Threat Isolation Under 3s', value: 97 },
  { label: 'Auto-Resolved Threats', value: 82 },
  { label: 'HKMA-Compliant Logging', value: 100 },
];

export const judgeRows = [
  { criteria: 'HK Relevance', delivery: '15,877 incidents cited with SME impact model' },
  { criteria: 'Technical Depth', delivery: '4-agent autonomous pipeline + zero-trust isolation' },
  { criteria: 'Execution', delivery: 'Realtime demo with SAFE-state conversion in 30 seconds' },
  { criteria: 'Commercial Value', delivery: '$49/mo entry tier tailored for HK SMEs' },
];

export const askPrizes = [
  '🥇 1st Place: Pilot grants and enterprise intros',
  '🥈 2nd Place: Expansion credits and cloud funding',
  '🥉 3rd Place: PR support and investor showcase',
];

export const roadmapGantt = [
  ['Task', 'Start', 'End'],
  ['Q1 2026 Beta', new Date(2026, 0, 1), new Date(2026, 2, 30)],
  ['Q2 2026 Pilot', new Date(2026, 3, 1), new Date(2026, 5, 30)],
  ['Q3 2026 Paid Launch', new Date(2026, 6, 1), new Date(2026, 8, 30)],
  ['Q4 2026 ASEAN Expansion', new Date(2026, 9, 1), new Date(2026, 11, 15)],
];

export const contacts = [
  { name: 'Ava Chan', email: 'ava@fortressai.hk', website: 'fortressai.hk', phone: '+852 9123 4567' },
  { name: 'Marcus Leung', email: 'marcus@fortressai.hk', website: 'fortressai.hk/demo', phone: '+852 9345 6789' },
  { name: 'Jade Wong', email: 'jade@fortressai.hk', website: 'fortressai.hk/security', phone: '+852 9567 8901' },
];

export const complianceLogs: LogLine[] = [
  {
    id: 'hkma-1',
    timestamp: '2026-02-19T08:30:00.000Z',
    source: 'Log Agent',
    severity: 'INFO',
    message: 'HKMA-AE-04 ledger write committed for incident #8821.',
  },
  {
    id: 'hkma-2',
    timestamp: '2026-02-19T08:31:11.000Z',
    source: 'Respond Agent',
    severity: 'WARN',
    message: 'Zero-trust policy patched for SME segment KWL-11.',
  },
  {
    id: 'hkma-3',
    timestamp: '2026-02-19T08:32:45.000Z',
    source: 'Recon Agent',
    severity: 'CRITICAL',
    message: 'Credential spray wave blocked from ASN-45102.',
  },
];
