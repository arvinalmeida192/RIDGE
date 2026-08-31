-- Firebase authentication + operational access requests

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128) UNIQUE,
  ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS operational_status VARCHAR(20) NOT NULL DEFAULT 'none'
    CHECK (operational_status IN ('none', 'pending', 'approved', 'rejected'));

ALTER TABLE users ALTER COLUMN username DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

CREATE TABLE IF NOT EXISTS operational_access_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason        TEXT,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by   UUID REFERENCES users(id),
  reviewed_at   TIMESTAMPTZ,
  review_notes  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_requests_status ON operational_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
