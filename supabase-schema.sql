-- ============================================
-- WheelEat Supabase Database Schema
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase project dashboard
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Copy and paste this ENTIRE file
-- 5. Click "Run" (or press Ctrl+Enter)
-- 6. You should see "Success. No rows returned"
--
-- ============================================

-- Create users table (example table for testing)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spin_logs table (for WheelEat app)
CREATE TABLE IF NOT EXISTS spin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_name TEXT NOT NULL,
  restaurant_unit TEXT,
  restaurant_floor TEXT,
  category TEXT NOT NULL,
  dietary_need TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  mall_id TEXT,
  selected_categories JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_spin_logs_timestamp ON spin_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_spin_logs_category ON spin_logs(category);
CREATE INDEX IF NOT EXISTS idx_spin_logs_mall_id ON spin_logs(mall_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert some example data for testing
INSERT INTO users (name, email) VALUES
  ('John Doe', 'john@example.com'),
  ('Jane Smith', 'jane@example.com')
ON CONFLICT (email) DO NOTHING;

-- Verify tables were created (this will show in the results)
SELECT 
  'Tables created successfully!' as status,
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM spin_logs) as spin_logs_count;

