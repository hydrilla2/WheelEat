-- User Sessions Table for tracking time spent on platform
-- This table tracks user sessions and calculates time spent

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT, -- Can be null for anonymous users
  session_start_ms INTEGER NOT NULL, -- Unix timestamp in milliseconds
  session_end_ms INTEGER, -- NULL if session is still active
  total_duration_seconds INTEGER, -- Calculated duration in seconds
  page_views INTEGER DEFAULT 0, -- Number of page views in this session
  last_activity_ms INTEGER NOT NULL, -- Last heartbeat timestamp
  user_agent TEXT,
  referer TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Index for querying active sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start ON user_sessions(session_start_ms);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(session_end_ms) WHERE session_end_ms IS NULL;

