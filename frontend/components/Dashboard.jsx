'use client';

import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

function StatCard({ label, value, neon = true }) {
  return (
    <div className={`card ${neon ? 'neon' : ''}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}

function ReconPanel({ data }) {
  const findings = data?.findings || [];
  return (
    <div className="panel">
      <h3>RECON AGENT</h3>
      <p>{data?.summary || 'nmap + asset discovery idle'}</p>
      <ul>
        {findings.map((f) => (
          <li key={`${f.port}-${f.service}`}>
            {f.service}:{f.port} ({f.state})
          </li>
        ))}
      </ul>
    </div>
  );
}

function SimulatePanel({ data }) {
  return (
    <div className="panel">
      <h3>SIMULATE AGENT</h3>
      <p>BERT HK phishing detector</p>
      <div className="big">{data ? `${Math.round(data.score * 100)}% match` : '95% target'}</div>
      <div>{data?.verdict || 'awaiting payload'}</div>
    </div>
  );
}

function RespondPanel({ data }) {
  return (
    <div className="panel">
      <h3>RESPOND AGENT</h3>
      <p>WireGuard tunnel deploy + kill switch</p>
      <div className="big">{data ? `${data.latency_ms}ms` : '3s deploy target'}</div>
      <div>{data?.kill_switch ? 'Kill switch active' : 'Kill switch pending'}</div>
    </div>
  );
}

function LogPanel({ data }) {
  return (
    <div className="panel">
      <h3>LOG AGENT</h3>
      <p>Hyperledger immutable trail</p>
      <div className="mono">{data?.tx_hash || '0xabc...'}</div>
      <div>{data?.compliance || 'HKMA_2026'}</div>
    </div>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState({});
  const [recon, setRecon] = useState(null);
  const [simulate, setSimulate] = useState(null);
  const [respond, setRespond] = useState(null);
  const [logData, setLogData] = useState(null);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(`${API_BASE.replace('http', 'ws')}/ws/status`);
    ws.onmessage = (evt) => {
      setMetrics(JSON.parse(evt.data));
    };
    return () => ws.close();
  }, []);

  const safeState = metrics.tunnel_active ? 'SAFE' : 'ALERT';

  const runDemo = async () => {
    const flow = await fetch(`${API_BASE}/demo`).then((r) => r.json());
    setRecon(flow.recon || null);
    setSimulate(flow.simulate || null);
    setRespond(flow.respond || null);
    setLogData(flow.log || null);
    setTimeline(flow.timeline || []);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autoDemo') === '1') {
      runDemo();
    }
  }, []);

  const logs = useMemo(() => metrics.agent_logs || [], [metrics]);

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <h1>FORTRESSAI</h1>
          <p>Autonomous 4-Agent Defense Pipeline</p>
        </div>
        <div className={`status ${safeState === 'SAFE' ? 'safe' : 'alert'}`}>
          <div className="pulse" />
          {safeState}
        </div>
      </section>

      <section className="stats">
        <StatCard label="Threats / sec" value={metrics.threats_per_sec || 0} />
        <StatCard label="p99 latency" value={`${metrics.p99_latency_ms || 3000}ms`} />
        <StatCard label="OWASP detection" value={`${metrics.owasp_detection_pct || 95}%`} />
        <StatCard label="Auto-resolved" value={`${metrics.auto_resolved_pct || 80}%`} />
      </section>

      <section className="grid">
        <ReconPanel data={recon} />
        <SimulatePanel data={simulate} />
        <RespondPanel data={respond} />
        <LogPanel data={logData} />
      </section>

      <section className="demo-row">
        <button onClick={runDemo} className="demo-btn">Run 30s Demo Flow</button>
        <div className="qr-wrap">
          <QRCodeSVG value="http://localhost:3000?autoDemo=1" size={130} fgColor="#39ff14" bgColor="transparent" />
          <span>Scan to auto-trigger</span>
        </div>
      </section>

      <section className="timeline">
        {timeline.map((t) => (
          <div key={`${t.step}-${t.at}`} className="time-item">
            <strong>{t.step.toUpperCase()}</strong>
            <span>{t.message}</span>
          </div>
        ))}
      </section>

      <section className="logs">
        <h3>Agent Logs</h3>
        {logs.slice(0, 8).map((l) => (
          <div key={`${l.timestamp}-${l.agent}`} className="log-line">
            <span className="mono">{new Date(l.timestamp).toLocaleTimeString()}</span>
            <span>{l.agent.toUpperCase()}</span>
            <span>{l.message}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
