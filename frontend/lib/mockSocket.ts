import { initialMetric, type ThreatMetric } from '@/data/mockData';

type SocketListener = (metric: ThreatMetric) => void;

export class MockThreatSocket {
  private listeners: Set<SocketListener> = new Set();
  private timer: NodeJS.Timeout | null = null;
  private metric: ThreatMetric = initialMetric;

  connect() {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      this.metric = {
        threatsPerMinute: Math.max(120, this.metric.threatsPerMinute + Math.round((Math.random() - 0.4) * 30)),
        tunnelLatencyMs: Math.max(950, this.metric.tunnelLatencyMs + Math.round((Math.random() - 0.5) * 240)),
        blockedThreats: this.metric.blockedThreats + Math.round(Math.random() * 8),
        owaspDetection: Math.min(100, Math.max(88, this.metric.owaspDetection + Math.round((Math.random() - 0.5) * 2))),
        autoResolved: Math.min(100, Math.max(70, this.metric.autoResolved + Math.round((Math.random() - 0.5) * 2))),
        status: Math.random() > 0.75 ? 'ALERT' : 'SAFE',
      };

      this.listeners.forEach((listener) => listener(this.metric));
    }, 2500);
  }

  subscribe(listener: SocketListener) {
    this.listeners.add(listener);
    listener(this.metric);
    return () => {
      this.listeners.delete(listener);
    };
  }

  disconnect() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const mockThreatSocket = new MockThreatSocket();
