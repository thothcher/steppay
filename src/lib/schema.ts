// Database schema. It is applied automatically on the first query
// (see db.ts) — every statement is idempotent, so running it twice is safe.
// Bump SCHEMA_VERSION whenever you change something below.

export const SCHEMA_VERSION = "1";

export const SCHEMA_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS app_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  group_name    TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'student',      -- student | admin
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A company is the legal business. The activation (onboarding) wizard fills it in.
CREATE TABLE IF NOT EXISTS companies (
  id                   SERIAL PRIMARY KEY,
  user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  legal_form           TEXT NOT NULL DEFAULT 'Individual entrepreneur',
  tax_id               TEXT NOT NULL DEFAULT '',
  address              TEXT NOT NULL DEFAULT '',
  director_name        TEXT NOT NULL DEFAULT '',
  director_personal_id TEXT NOT NULL DEFAULT '',
  director_birth_date  TEXT NOT NULL DEFAULT '',
  iban                 TEXT NOT NULL DEFAULT '',
  bank_name            TEXT NOT NULL DEFAULT '',
  account_holder       TEXT NOT NULL DEFAULT '',
  onboarding_step      INTEGER NOT NULL DEFAULT 2,     -- next step to complete (1..4), 5 = done
  status               TEXT NOT NULL DEFAULT 'pending', -- pending | activated
  activated_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A merchant is one website / shop. It owns the API keys.
CREATE TABLE IF NOT EXISTS merchants (
  id             SERIAL PRIMARY KEY,
  merchant_id    INTEGER NOT NULL UNIQUE,              -- public 7-digit ID used in the API
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id     INTEGER REFERENCES companies(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  url            TEXT NOT NULL DEFAULT '',
  secret_key     TEXT NOT NULL,
  callback_url   TEXT NOT NULL DEFAULT '',
  allow_unsigned BOOLEAN NOT NULL DEFAULT TRUE,        -- browser SDK / payment links without signature
  fee_bps        INTEGER NOT NULL DEFAULT 200,         -- 200 = 2.00 %
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS payment_id_seq START 1013000001;

CREATE TABLE IF NOT EXISTS payments (
  id                   SERIAL PRIMARY KEY,
  payment_id           INTEGER NOT NULL UNIQUE DEFAULT nextval('payment_id_seq'),
  merchant_ref         INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  order_id             TEXT NOT NULL,
  order_desc           TEXT NOT NULL,
  amount               INTEGER NOT NULL,              -- minor units: 2550 = 25.50
  currency             TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'created', -- created | processing | approved | declined | expired | reversed
  token                TEXT NOT NULL UNIQUE,
  source               TEXT NOT NULL DEFAULT 'api',   -- api | sdk | link | playground
  signed               BOOLEAN NOT NULL DEFAULT TRUE,
  response_url         TEXT NOT NULL DEFAULT '',
  server_callback_url  TEXT NOT NULL DEFAULT '',
  sender_email         TEXT NOT NULL DEFAULT '',
  merchant_data        TEXT NOT NULL DEFAULT '',
  lang                 TEXT NOT NULL DEFAULT 'en',
  preauth              BOOLEAN NOT NULL DEFAULT FALSE,
  captured             BOOLEAN NOT NULL DEFAULT FALSE,
  captured_at          TIMESTAMPTZ,
  reversal_amount      INTEGER NOT NULL DEFAULT 0,
  masked_card          TEXT NOT NULL DEFAULT '',
  card_bin             TEXT NOT NULL DEFAULT '',
  card_type            TEXT NOT NULL DEFAULT '',
  card_holder          TEXT NOT NULL DEFAULT '',
  rrn                  TEXT NOT NULL DEFAULT '',
  approval_code        TEXT NOT NULL DEFAULT '',
  response_code        TEXT NOT NULL DEFAULT '',
  response_description TEXT NOT NULL DEFAULT '',
  pending              JSONB,                         -- 3-D Secure state while waiting for the code
  expires_at           TIMESTAMPTZ NOT NULL,
  paid_at              TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (merchant_ref, order_id)
);
CREATE INDEX IF NOT EXISTS payments_merchant_created_idx ON payments (merchant_ref, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_status_expires_idx ON payments (status, expires_at);

CREATE TABLE IF NOT EXISTS refunds (
  id          SERIAL PRIMARY KEY,
  payment_ref INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,
  comment     TEXT NOT NULL DEFAULT '',
  source      TEXT NOT NULL DEFAULT 'portal',        -- portal | api | chargeback
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disputes (
  id           SERIAL PRIMARY KEY,
  payment_ref  INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  reason_code  TEXT NOT NULL,
  reason       TEXT NOT NULL,
  amount       INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'needs_response', -- needs_response | under_review | won | lost
  evidence     TEXT NOT NULL DEFAULT '',
  evidence_at  TIMESTAMPTZ,
  due_at       TIMESTAMPTZ NOT NULL,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS callbacks (
  id            SERIAL PRIMARY KEY,
  payment_ref   INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  event         TEXT NOT NULL,                         -- purchase | reverse | capture | manual
  request_body  TEXT NOT NULL,
  http_status   INTEGER,
  response_body TEXT NOT NULL DEFAULT '',
  error         TEXT NOT NULL DEFAULT '',
  duration_ms   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS callbacks_payment_idx ON callbacks (payment_ref, created_at DESC);

CREATE TABLE IF NOT EXISTS api_logs (
  id            SERIAL PRIMARY KEY,
  merchant_ref  INTEGER REFERENCES merchants(id) ON DELETE CASCADE,
  merchant_id   TEXT NOT NULL DEFAULT '',
  endpoint      TEXT NOT NULL,
  request_body  TEXT NOT NULL,
  response_body TEXT NOT NULL,
  success       BOOLEAN NOT NULL,
  error_code    INTEGER,
  origin        TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_logs_merchant_idx ON api_logs (merchant_ref, created_at DESC);

CREATE TABLE IF NOT EXISTS payment_links (
  id           SERIAL PRIMARY KEY,
  merchant_ref INTEGER NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  amount       INTEGER,                                -- NULL = customer enters the amount
  currency     TEXT NOT NULL,
  response_url TEXT NOT NULL DEFAULT '',
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL DEFAULT 'info',
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  link       TEXT NOT NULL DEFAULT '',
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC);
`;
