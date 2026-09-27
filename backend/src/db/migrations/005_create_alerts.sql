-- 005_create_alerts.sql
CREATE TABLE batch_alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id            UUID REFERENCES batches(id) ON DELETE CASCADE,
  farmer_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  alert_type          VARCHAR(20)
                      CHECK (alert_type IN
                      ('early_warning','recall','expiry','system')),
  condition_triggered VARCHAR(5),
  alert_reason        TEXT NOT NULL,
  suggested_action    TEXT,
  is_read             BOOLEAN DEFAULT FALSE,
  is_dismissed        BOOLEAN DEFAULT FALSE,
  triggered_at        TIMESTAMPTZ DEFAULT NOW(),
  read_at             TIMESTAMPTZ,
  dismissed_at        TIMESTAMPTZ
);

CREATE INDEX idx_alerts_farmer ON batch_alerts(farmer_id);
CREATE INDEX idx_alerts_unread ON batch_alerts(farmer_id, is_read)
  WHERE is_read = FALSE;
