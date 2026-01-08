-- D1 Database Schema for Users Table
-- Supports both authenticated (Google) and anonymous users

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,  -- Can be Google ID or anonymous ID (anon_xxx)
  name TEXT NOT NULL,
  email TEXT,  -- NULL for anonymous users, required for Google users
  created_at INTEGER NOT NULL,  -- Unix timestamp
  updated_at INTEGER NOT NULL   -- Unix timestamp
);

-- Index for email lookups (only for authenticated users)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;

-- Index for anonymous users
CREATE INDEX IF NOT EXISTS idx_users_anonymous ON users(id) WHERE email IS NULL;

