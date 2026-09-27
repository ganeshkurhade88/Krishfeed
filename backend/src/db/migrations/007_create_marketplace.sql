-- 007_create_marketplace.sql
CREATE TABLE marketplace_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        UUID REFERENCES batches(id) ON DELETE CASCADE,
  farmer_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  price_per_kg    DECIMAL(10,2),
  min_quantity_kg DECIMAL(10,2),
  available_kg    DECIMAL(10,2),
  listing_status  VARCHAR(20) DEFAULT 'active'
                  CHECK (listing_status IN
                  ('active','sold','expired','recalled','removed')),
  listed_at       TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ
);
