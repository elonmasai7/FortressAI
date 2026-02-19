CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS threats (
  id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  agent TEXT,
  severity INT,
  status TEXT,
  details TEXT DEFAULT '',
  PRIMARY KEY (id, timestamp)
);

CREATE TABLE IF NOT EXISTS tunnels (
  id UUID PRIMARY KEY,
  endpoint TEXT,
  latency_ms INT,
  active BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT create_hypertable('threats', 'timestamp', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_threats_id ON threats (id);
