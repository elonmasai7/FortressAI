'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Shield, ShieldAlert } from 'lucide-react';
import { clearAuthToken, getAuthToken, getSocketIoAuth, getSocketIoBase, guardianFetch, setAuthToken } from '@/lib/guardian';

type AlertItem = {
  id: string;
  severity: string;
  category: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
};

type UserProfile = {
  id: string;
  email: string;
  region: string;
  created_at: string;
};

type SocketLike = {
  on: (event: string, handler: (payload: AlertItem) => void) => void;
  disconnect: () => void;
};

declare global {
  interface Window {
    io?: (baseUrl: string, options: { transports: string[]; auth: { token: string } }) => SocketLike;
  }
}

const CHAINS = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'base'];

export default function GuardianPage() {
  const [tokenPresent, setTokenPresent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('HK');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [wallet, setWallet] = useState('');
  const [walletChain, setWalletChain] = useState('ethereum');
  const [threshold, setThreshold] = useState(1000);
  const [contractAddress, setContractAddress] = useState('');
  const [checkUrl, setCheckUrl] = useState('');

  const [monitorResult, setMonitorResult] = useState('');
  const [approvalResult, setApprovalResult] = useState('');
  const [contractResult, setContractResult] = useState('');
  const [phishingResult, setPhishingResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const socketRef = useRef<SocketLike | null>(null);

  useEffect(() => {
    setTokenPresent(Boolean(getAuthToken()));
  }, []);

  const criticalCount = useMemo(() => alerts.filter((a) => a.severity === 'critical' && a.status === 'open').length, [alerts]);

  async function loadAlerts() {
    try {
      const rows = await guardianFetch<AlertItem[]>('/guardian/alerts');
      setAlerts(rows);
    } catch {
      return;
    }
  }

  async function loadCurrentUser() {
    try {
      const user = await guardianFetch<UserProfile>('/guardian/auth/me');
      setCurrentUser(user);
    } catch {
      setCurrentUser(null);
    }
  }

  useEffect(() => {
    if (!tokenPresent) return;

    loadAlerts();
    loadCurrentUser();
    socketRef.current?.disconnect();

    let script: HTMLScriptElement | null = null;

    const connectSocket = () => {
      if (typeof window.io !== 'function') return;
      const socket = window.io(getSocketIoBase(), {
        transports: ['websocket'],
        auth: getSocketIoAuth(),
      });
      socket.on('alerts:update', (payload: AlertItem) => {
        setAlerts((current) => [payload, ...current.filter((row) => row.id !== payload.id)].slice(0, 100));
      });
      socketRef.current = socket;
    };

    if (typeof window.io === 'function') {
      connectSocket();
    } else {
      script = document.createElement('script');
      script.src = `${getSocketIoBase()}/socket.io/socket.io.js`;
      script.async = true;
      script.onload = connectSocket;
      document.body.appendChild(script);
    }

    return () => {
      socketRef.current?.disconnect();
      if (script) {
        script.remove();
      }
    };
  }, [tokenPresent]);

  async function handleAuth(mode: 'login' | 'register', event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const path = mode === 'login' ? '/guardian/auth/login' : '/guardian/auth/register';
      const payload = mode === 'login' ? { email, password } : { email, password, region };
      const response = await guardianFetch<{ access_token: string; user?: UserProfile }>(path, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setAuthToken(response.access_token);
      if (response.user) {
        setCurrentUser(response.user);
      }
      setTokenPresent(true);
      if (!response.user) {
        await loadCurrentUser();
      }
      await loadAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  async function monitorWallet() {
    setError('');
    setLoading(true);
    try {
      const response = await guardianFetch<{ checked_transactions: number; alerts_created: number; suspicious_events: unknown[] }>(
        '/guardian/monitor-wallet',
        {
          method: 'POST',
          body: JSON.stringify({ wallet_address: wallet, chain: walletChain, threshold_usd: threshold }),
        },
      );
      setMonitorResult(
        `Checked ${response.checked_transactions} txns, suspicious=${response.suspicious_events.length}, alerts=${response.alerts_created}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wallet monitoring failed');
    } finally {
      setLoading(false);
    }
  }

  async function scanApprovals() {
    setError('');
    setLoading(true);
    try {
      const response = await guardianFetch<{ count: number; approvals: Array<{ tx_hash: string; risk_score: number; reasons: string[] }> }>(
        '/guardian/scan-approvals',
        {
          method: 'POST',
          body: JSON.stringify({ wallet_address: wallet, chain: walletChain }),
        },
      );
      const preview = response.approvals.slice(0, 3).map((a) => `${a.tx_hash.slice(0, 10)}... score=${a.risk_score}`).join(' | ');
      setApprovalResult(`Approvals=${response.count}${preview ? ` | ${preview}` : ''}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval scan failed');
    } finally {
      setLoading(false);
    }
  }

  async function analyzeContract() {
    setError('');
    setLoading(true);
    try {
      const response = await guardianFetch<{ risk_score: number; verdict: string; findings: string[] }>('/guardian/analyze-contract', {
        method: 'POST',
        body: JSON.stringify({ contract_address: contractAddress, chain: walletChain }),
      });
      setContractResult(`Risk=${response.risk_score} (${response.verdict}) | ${response.findings.slice(0, 3).join('; ') || 'No high-risk flags'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Contract analysis failed');
    } finally {
      setLoading(false);
    }
  }

  async function checkPhishing() {
    setError('');
    setLoading(true);
    try {
      const response = await guardianFetch<{ risk_score: number; malicious: boolean; reasons: string[] }>('/guardian/check-phishing', {
        method: 'POST',
        body: JSON.stringify({ url: checkUrl }),
      });
      setPhishingResult(
        `${response.malicious ? 'MALICIOUS' : 'Likely safe'} (risk ${response.risk_score}) ${response.reasons.slice(0, 2).join('; ')}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Phishing check failed');
    } finally {
      setLoading(false);
    }
  }

  async function setAlertStatus(alertId: string, status: string) {
    try {
      await guardianFetch(`/guardian/alerts/${alertId}/action`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      setAlerts((current) => current.map((row) => (row.id === alertId ? { ...row, status } : row)));
    } catch {
      return;
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">FortressAI: Blockchain Security Guardian</h1>
            <p className="mt-1 text-sm text-slate-400">Production-oriented wallet threat defense for individuals and SMEs.</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded border border-red-500/40 bg-red-950/50 px-2 py-1 text-red-200">
              Critical Open: {criticalCount}
            </span>
            {tokenPresent ? (
              <button
                className="rounded border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-900"
                onClick={() => {
                  clearAuthToken();
                  setTokenPresent(false);
                  setCurrentUser(null);
                  socketRef.current?.disconnect();
                }}
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>
        {tokenPresent && currentUser ? (
          <p className="mb-4 text-sm text-slate-300">
            Signed in as {currentUser.email} ({currentUser.region})
          </p>
        ) : null}

        {!tokenPresent ? (
          <section className="grid gap-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4 md:grid-cols-2">
            <form className="space-y-3" onSubmit={(e) => handleAuth('login', e)}>
              <h2 className="text-lg font-medium">Login</h2>
              <input
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button disabled={loading} className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500">
                Sign In
              </button>
            </form>

            <form className="space-y-3" onSubmit={(e) => handleAuth('register', e)}>
              <h2 className="text-lg font-medium">Register</h2>
              <input
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="Region (HK / KE)"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
              <button disabled={loading} className="rounded bg-sky-600 px-3 py-2 text-sm font-medium hover:bg-sky-500">
                Create Account
              </button>
            </form>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            <article className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center gap-2 text-emerald-300">
                <Shield className="h-4 w-4" />
                <h2 className="font-medium">Wallet Monitor</h2>
              </div>
              <input
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="Wallet address"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <select className="rounded border border-slate-700 bg-slate-950 px-3 py-2" value={walletChain} onChange={(e) => setWalletChain(e.target.value)}>
                  {CHAINS.map((chain) => (
                    <option key={chain} value={chain}>
                      {chain}
                    </option>
                  ))}
                </select>
                <input
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2"
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value || 0))}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={monitorWallet} disabled={loading} className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500">
                  Monitor Wallet
                </button>
                <button onClick={scanApprovals} disabled={loading} className="rounded bg-amber-600 px-3 py-2 text-sm font-medium hover:bg-amber-500">
                  Scan Approvals
                </button>
              </div>
              {monitorResult ? <p className="text-sm text-slate-300">{monitorResult}</p> : null}
              {approvalResult ? <p className="text-sm text-slate-300">{approvalResult}</p> : null}
            </article>

            <article className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center gap-2 text-yellow-200">
                <ShieldAlert className="h-4 w-4" />
                <h2 className="font-medium">Phishing + Contract Analysis</h2>
              </div>
              <input
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="URL to check"
                value={checkUrl}
                onChange={(e) => setCheckUrl(e.target.value)}
              />
              <button onClick={checkPhishing} disabled={loading} className="rounded bg-fuchsia-700 px-3 py-2 text-sm font-medium hover:bg-fuchsia-600">
                Check URL
              </button>
              {phishingResult ? <p className="text-sm text-slate-300">{phishingResult}</p> : null}

              <input
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
                placeholder="Contract address"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
              />
              <button onClick={analyzeContract} disabled={loading} className="rounded bg-cyan-700 px-3 py-2 text-sm font-medium hover:bg-cyan-600">
                Analyze Contract
              </button>
              {contractResult ? <p className="text-sm text-slate-300">{contractResult}</p> : null}
            </article>
          </section>
        )}

        <section className="mt-4 rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-300" />
            <h2 className="font-medium">Real-Time Alerts</h2>
          </div>
          <div className="space-y-2">
            {alerts.length === 0 ? <p className="text-sm text-slate-400">No alerts yet.</p> : null}
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded border border-slate-700 bg-slate-950/80 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {alert.status === 'open' ? <ShieldAlert className="h-4 w-4 text-red-300" /> : <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
                    <span className="font-medium">{alert.title}</span>
                    <span className="rounded border border-slate-600 px-1.5 py-0.5 text-xs uppercase text-slate-300">{alert.severity}</span>
                    <span className="rounded border border-slate-600 px-1.5 py-0.5 text-xs text-slate-400">{alert.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setAlertStatus(alert.id, 'acknowledged')} className="rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-900">
                      Acknowledge
                    </button>
                    <button onClick={() => setAlertStatus(alert.id, 'snoozed')} className="rounded border border-slate-600 px-2 py-1 text-xs hover:bg-slate-900">
                      Snooze
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-slate-300">{alert.message}</p>
              </div>
            ))}
          </div>
        </section>

        {error ? <p className="mt-4 rounded border border-red-500/40 bg-red-950/50 p-3 text-sm text-red-200">{error}</p> : null}
      </div>
    </main>
  );
}
