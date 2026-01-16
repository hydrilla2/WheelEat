-- Voucher System (testing / restaurant-of-the-day)
--
-- Scenario / Rules:
-- - Voucher value: RM5
-- - Min spend: RM30
-- - Total vouchers per restaurant: 5
-- - Claim requires Google login (enforced by frontend; backend expects a stable user_id)
-- - Voucher expiry: 24 hours from claim time
--
-- Notes:
-- - `vouchers.remaining_qty` is the current available stock.
-- - `user_vouchers.status` is one of: active / removed / expired / used
-- - Stock is decremented atomically when issuing an active user voucher.
-- - Stock is incremented when a voucher is removed or expires.
-- - Stock is NOT incremented when a voucher is used.

PRAGMA foreign_keys = ON;

-- IMPORTANT (Cloudflare D1):
-- - If you previously executed an older voucher schema (Far Coffee demo),
--   you MUST migrate manually. D1 doesn't run migrations automatically.
-- - This file is safe for fresh installs.
-- - For existing installs, consider dropping old `vouchers` / `user_vouchers` tables
--   if you don't need old data, then re-run this file.

CREATE TABLE IF NOT EXISTS vouchers (
  id TEXT PRIMARY KEY,
  merchant_name TEXT NOT NULL,
  merchant_logo TEXT,
  value_rm INTEGER NOT NULL CHECK (value_rm > 0),
  min_spend_rm INTEGER NOT NULL CHECK (min_spend_rm >= 0),
  total_qty INTEGER NOT NULL CHECK (total_qty >= 0),
  remaining_qty INTEGER NOT NULL CHECK (remaining_qty >= 0),
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vouchers_merchant_name ON vouchers (merchant_name);

CREATE TABLE IF NOT EXISTS user_vouchers (
  id TEXT PRIMARY KEY,                 -- user_voucher_id
  user_id TEXT NOT NULL,
  voucher_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'removed', 'expired', 'used')),
  issued_at_ms INTEGER NOT NULL,
  expired_at_ms INTEGER NOT NULL,
  removed_at_ms INTEGER,
  used_at_ms INTEGER,
  updated_at_ms INTEGER NOT NULL,
  FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
);

CREATE INDEX IF NOT EXISTS idx_user_vouchers_user ON user_vouchers (user_id);
CREATE INDEX IF NOT EXISTS idx_user_vouchers_status ON user_vouchers (status);
CREATE INDEX IF NOT EXISTS idx_user_vouchers_expired_at ON user_vouchers (expired_at_ms);
CREATE INDEX IF NOT EXISTS idx_user_vouchers_voucher ON user_vouchers (voucher_id);


