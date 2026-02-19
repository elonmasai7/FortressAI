'use client';

import { useEffect, useMemo, useState } from 'react';
import { complianceLogs, type LogLine, type ThreatMetric } from '@/data/mockData';
import { mockThreatSocket } from '@/lib/mockSocket';

export function useMockRealtime() {
  const [metric, setMetric] = useState<ThreatMetric | null>(null);
  const [logs, setLogs] = useState<LogLine[]>(complianceLogs);

  useEffect(() => {
    mockThreatSocket.connect();
    const unsubscribe = mockThreatSocket.subscribe((next) => {
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

    return () => {
      unsubscribe();
      mockThreatSocket.disconnect();
    };
  }, []);

  const statusTone = useMemo(() => (metric?.status === 'SAFE' ? 'text-fortress-green' : 'text-fortress-red'), [metric?.status]);

  return { metric, logs, statusTone };
}
