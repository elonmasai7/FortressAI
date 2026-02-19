'use client';

import { useEffect, useMemo, useState } from 'react';
import { complianceLogs, type LogLine, type ThreatMetric } from '@/data/mockData';
import { getWsBase } from '@/lib/backend';
import { mockThreatSocket } from '@/lib/mockSocket';

type BackendStatusPayload = {
  threats_per_sec: number;
  threats_blocked: number;
  tunnel_active: boolean;
  p99_latency_ms: number;
  auto_resolved_pct: number;
  owasp_detection_pct: number;
  agent_logs?: Array<{
    timestamp: string;
    agent: string;
    message: string;
    level: 'info' | 'warn' | 'critical';
  }>;
};

function mapBackendMetric(payload: BackendStatusPayload): ThreatMetric {
  return {
    threatsPerMinute: payload.threats_per_sec * 60,
    tunnelLatencyMs: payload.p99_latency_ms,
    blockedThreats: payload.threats_blocked,
    owaspDetection: payload.owasp_detection_pct,
    autoResolved: payload.auto_resolved_pct,
    status: payload.tunnel_active ? 'SAFE' : 'ALERT',
  };
}

function mapBackendLogs(payload: BackendStatusPayload): LogLine[] {
  return (
    payload.agent_logs?.slice(0, 10).map((line, index) => ({
      id: `${line.timestamp}-${line.agent}-${index}`,
      timestamp: line.timestamp,
      source: line.agent,
      severity: line.level === 'critical' ? 'CRITICAL' : line.level === 'warn' ? 'WARN' : 'INFO',
      message: line.message,
    })) || []
  );
}

export function useMockRealtime() {
  const [metric, setMetric] = useState<ThreatMetric | null>(null);
  const [logs, setLogs] = useState<LogLine[]>(complianceLogs);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let mockUnsubscribe: (() => void) | null = null;
    let fallbackTimer: NodeJS.Timeout | null = null;
    let usingMock = false;
    let wsOpened = false;

    const startMockFallback = () => {
      if (usingMock) {
        return;
      }
      usingMock = true;
      setConnected(false);
      mockThreatSocket.connect();
      mockUnsubscribe = mockThreatSocket.subscribe((next) => {
        setMetric(next);
        setLogs((current) => {
          const entry: LogLine = {
            id: `auto-${Date.now()}`,
            timestamp: new Date().toISOString(),
            source: next.status === 'SAFE' ? 'Respond Agent' : 'Recon Agent',
            severity: next.status === 'SAFE' ? 'INFO' : 'CRITICAL',
            message:
              next.status === 'SAFE'
                ? `Tunnel latency stabilized at ${next.tunnelLatencyMs}ms.`
                : `Threat burst detected: ${next.threatsPerMinute}/min.`,
          };

          return [entry, ...current].slice(0, 10);
        });
      });
    };

    try {
      socket = new WebSocket(`${getWsBase()}/ws/status`);
      socket.onopen = () => {
        setConnected(true);
        wsOpened = true;
        usingMock = false;
      };
      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data) as BackendStatusPayload;
        setMetric(mapBackendMetric(payload));
        const backendLogs = mapBackendLogs(payload);
        if (backendLogs.length > 0) {
          setLogs(backendLogs);
        }
      };
      socket.onerror = () => {
        startMockFallback();
      };
      socket.onclose = () => {
        if (!usingMock) {
          startMockFallback();
        }
      };
      fallbackTimer = setTimeout(() => {
        if (!wsOpened) {
          startMockFallback();
        }
      }, 2000);
    } catch {
      startMockFallback();
    }

    return () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
      if (socket && socket.readyState < WebSocket.CLOSING) {
        socket.close();
      }
      if (mockUnsubscribe) {
        mockUnsubscribe();
      }
      mockThreatSocket.disconnect();
    };
  }, []);

  const statusTone = useMemo(() => (metric?.status === 'SAFE' ? 'text-fortress-green' : 'text-fortress-red'), [metric?.status]);

  return { metric, logs, statusTone, connected };
}
