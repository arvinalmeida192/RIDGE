-- Phase 2: Ingestion job tracking

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name          VARCHAR(50) NOT NULL,
  status            VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at       TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  error_message     TEXT,
  metadata          JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_job_time
  ON ingestion_runs(job_name, started_at DESC);

-- Track historical backfill completion per zone
CREATE TABLE IF NOT EXISTS ingestion_state (
  key         VARCHAR(100) PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
