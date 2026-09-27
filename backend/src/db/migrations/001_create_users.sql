-- 001_create_users.sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100) NOT NULL,
  phone           VARCHAR(15) UNIQUE NOT NULL,
  email           VARCHAR(255) UNIQUE,
  password_hash   TEXT NOT NULL,
  role            VARCHAR(20) DEFAULT 'farmer'
                  CHECK (role IN ('farmer','buyer','admin')),
  language_pref   VARCHAR(5) DEFAULT 'mr'
                  CHECK (language_pref IN ('mr','hi','en')),
  district        VARCHAR(100),
  state           VARCHAR(100),
  is_verified     BOOLEAN DEFAULT FALSE,
  consent_given   BOOLEAN DEFAULT FALSE,
  consent_date    TIMESTAMPTZ,
  data_erasure_requested BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);

CREATE TABLE consent_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  consent_type    VARCHAR(50) NOT NULL,
  consent_given   BOOLEAN NOT NULL,
  ip_address      TEXT,
  user_agent      TEXT,
  consented_at    TIMESTAMPTZ DEFAULT NOW()
);
