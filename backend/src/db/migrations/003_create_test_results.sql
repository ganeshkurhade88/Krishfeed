-- 003_create_test_results.sql
CREATE TABLE test_results (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id              UUID REFERENCES batches(id) ON DELETE CASCADE,
  visual_score          INTEGER CHECK (visual_score BETWEEN 0 AND 100),
  visual_classification VARCHAR(30),
  crude_protein_min     DECIMAL(5,2),
  crude_protein_max     DECIMAL(5,2),
  moisture_min          DECIMAL(5,2),
  moisture_max          DECIMAL(5,2),
  fiber_ndf_min         DECIMAL(5,2),
  fiber_ndf_max         DECIMAL(5,2),
  energy_me_min         DECIMAL(5,2),
  energy_me_max         DECIMAL(5,2),
  aflatoxin_risk        VARCHAR(10)
                        CHECK (aflatoxin_risk IN ('low','medium','high')),
  urea_risk             VARCHAR(10)
                        CHECK (urea_risk IN ('low','medium','high')),
  sand_risk             VARCHAR(10)
                        CHECK (sand_risk IN ('low','medium','high')),
  ph_estimate_min       DECIMAL(4,2),
  ph_estimate_max       DECIMAL(4,2),
  fermentation_quality  VARCHAR(20),
  overall_risk_level    VARCHAR(10)
                        CHECK (overall_risk_level IN
                        ('low','medium','high','critical')),
  estimation_method     VARCHAR(30) DEFAULT 'rule_based_ai',
  disclaimer_shown      BOOLEAN DEFAULT TRUE,
  tested_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE risk_forecasts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        UUID REFERENCES batches(id) ON DELETE CASCADE,
  base_score      INTEGER NOT NULL,
  day_7_score     INTEGER,
  day_15_score    INTEGER,
  day_30_score    INTEGER,
  decay_rate      DECIMAL(5,4),
  aflatoxin_day7  VARCHAR(10),
  aflatoxin_day15 VARCHAR(10),
  aflatoxin_day30 VARCHAR(10),
  model_version   VARCHAR(10) DEFAULT 'v1.0',
  generated_at    TIMESTAMPTZ DEFAULT NOW()
);
