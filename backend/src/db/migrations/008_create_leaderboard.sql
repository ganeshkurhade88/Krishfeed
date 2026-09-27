-- 008_create_leaderboard.sql
CREATE TABLE leaderboard_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  district        VARCHAR(100) NOT NULL,
  state           VARCHAR(100),
  month           VARCHAR(7) NOT NULL,
  avg_score       DECIMAL(5,2),
  batch_count     INTEGER DEFAULT 0,
  district_rank   INTEGER,
  percentile      INTEGER,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
