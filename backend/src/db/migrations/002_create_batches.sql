-- 002_create_batches.sql
CREATE TABLE batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_code      VARCHAR(30) UNIQUE NOT NULL,
  farmer_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  feed_type       VARCHAR(50) NOT NULL,
  quantity_kg     DECIMAL(10,2) NOT NULL,
  district        VARCHAR(100),
  state           VARCHAR(100),
  storage_type    VARCHAR(30)
                  CHECK (storage_type IN
                  ('pit','bunker','bag','open','shed')),
  date_stored     DATE NOT NULL,
  opening_freq    VARCHAR(20)
                  CHECK (opening_freq IN
                  ('daily','every_2_3_days','weekly')),
  moisture_feel   VARCHAR(20)
                  CHECK (moisture_feel IN
                  ('dry','moist','wet','waterlogged')),
  colour          VARCHAR(30),
  smell           VARCHAR(30),
  image_url       TEXT,
  image_consent   BOOLEAN DEFAULT FALSE,
  temperature_c   DECIMAL(5,2),
  temp_source     VARCHAR(20) DEFAULT 'weather_api',
  status          VARCHAR(20) DEFAULT 'active'
                  CHECK (status IN
                  ('active','sold','recalled','expired','deleted')),
  is_listed       BOOLEAN DEFAULT FALSE,
  qr_public_url   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_batches_farmer ON batches(farmer_id);
CREATE INDEX idx_batches_district ON batches(district);
CREATE INDEX idx_batches_status ON batches(status);
