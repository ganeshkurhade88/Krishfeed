-- 006_create_traceability.sql
CREATE TABLE batch_traceability (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        UUID REFERENCES batches(id) ON DELETE CASCADE,
  seller_id       UUID REFERENCES users(id),
  buyer_id        UUID REFERENCES users(id),
  quantity_sold   DECIMAL(10,2),
  sale_date       DATE NOT NULL,
  sale_status     VARCHAR(20) DEFAULT 'active'
                  CHECK (sale_status IN
                  ('active','completed','recalled','disputed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trace_batch ON batch_traceability(batch_id);
CREATE INDEX idx_trace_buyer ON batch_traceability(buyer_id);

CREATE TABLE batch_reports (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id              UUID REFERENCES batches(id) ON DELETE CASCADE,
  reported_by           UUID REFERENCES users(id),
  report_type           VARCHAR(30),
  report_description    TEXT,
  report_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  sale_date             DATE,
  days_since_sale       INTEGER GENERATED ALWAYS AS
                        (report_date - sale_date) STORED,
  recall_eligible       BOOLEAN GENERATED ALWAYS AS
                        (report_date - sale_date <= 10) STORED,
  is_recall_triggered   BOOLEAN DEFAULT FALSE,
  reviewed_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
