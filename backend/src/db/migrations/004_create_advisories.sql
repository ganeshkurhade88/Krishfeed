-- 004_create_advisories.sql
CREATE TABLE advisories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id            UUID REFERENCES batches(id) ON DELETE CASCADE,
  feed_decision       VARCHAR(20)
                      CHECK (feed_decision IN
                      ('feed_now','hold','discard','monitor')),
  feed_days_safe      INTEGER,
  nutritional_gap     TEXT,
  nutritional_action  TEXT,
  storage_fix         TEXT,
  advisory_mr         TEXT,  
  advisory_hi         TEXT,  
  advisory_en         TEXT,  
  generated_at        TIMESTAMPTZ DEFAULT NOW()
);
