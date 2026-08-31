-- Phase 4: Citizen alert subscriptions

CREATE TABLE IF NOT EXISTS alert_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id     VARCHAR(10) NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  phone       VARCHAR(20) NOT NULL,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (zone_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_alert_subscriptions_zone ON alert_subscriptions(zone_id) WHERE is_active = TRUE;
