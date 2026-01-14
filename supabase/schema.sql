-- ============================================
-- X Posting Agent - Supabase Schema
-- Multi-tenant daily posting system
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Table: startup_profiles
-- Stores startup information for post generation
-- ============================================
CREATE TABLE IF NOT EXISTS startup_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  description TEXT,
  target_audience TEXT,
  key_features TEXT[],
  mission TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- Table: x_oauth_tokens
-- Stores encrypted X OAuth tokens per user
-- ============================================
CREATE TABLE IF NOT EXISTS x_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  x_user_id TEXT NOT NULL,
  x_username TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL, -- Encrypted with pgcrypto
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(x_user_id)
);

-- ============================================
-- Table: post_history
-- Tracks all posts made via the agent
-- ============================================
CREATE TABLE IF NOT EXISTS post_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_text TEXT NOT NULL,
  x_post_id TEXT, -- X API post ID
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
  error_message TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: posting_schedule
-- Tracks daily posting schedule per user
-- ============================================
CREATE TABLE IF NOT EXISTS posting_schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  post_time TIME DEFAULT '09:00:00', -- Default 9 AM
  timezone TEXT DEFAULT 'UTC',
  last_posted_at TIMESTAMPTZ,
  next_post_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_startup_profiles_user_id ON startup_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_x_oauth_tokens_user_id ON x_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_post_history_user_id ON post_history(user_id);
CREATE INDEX IF NOT EXISTS idx_post_history_posted_at ON post_history(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_history_status ON post_history(status);
CREATE INDEX IF NOT EXISTS idx_posting_schedule_user_id ON posting_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_posting_schedule_next_post ON posting_schedule(next_post_at) WHERE is_active = true;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE startup_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE x_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_schedule ENABLE ROW LEVEL SECURITY;

-- startup_profiles policies
CREATE POLICY "Users can view own profile"
  ON startup_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON startup_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON startup_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- x_oauth_tokens policies
CREATE POLICY "Users can view own tokens"
  ON x_oauth_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens"
  ON x_oauth_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens"
  ON x_oauth_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens"
  ON x_oauth_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- post_history policies
CREATE POLICY "Users can view own posts"
  ON post_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts"
  ON post_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- posting_schedule policies
CREATE POLICY "Users can view own schedule"
  ON posting_schedule FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own schedule"
  ON posting_schedule FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own schedule"
  ON posting_schedule FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Service Role Functions (for n8n backend)
-- These bypass RLS and require service role key
-- ============================================

-- Function to get user data for posting (used by n8n)
CREATE OR REPLACE FUNCTION get_user_for_posting(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  company_name TEXT,
  industry TEXT,
  description TEXT,
  x_username TEXT,
  access_token_encrypted TEXT
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.user_id,
    sp.company_name,
    sp.industry,
    sp.description,
    xot.x_username,
    xot.access_token_encrypted
  FROM startup_profiles sp
  INNER JOIN x_oauth_tokens xot ON sp.user_id = xot.user_id
  WHERE sp.user_id = p_user_id
    AND xot.token_expires_at > NOW();
END;
$$;

-- Function to get users scheduled for posting today
CREATE OR REPLACE FUNCTION get_users_scheduled_today()
RETURNS TABLE (
  user_id UUID,
  company_name TEXT,
  industry TEXT,
  description TEXT,
  x_username TEXT,
  access_token_encrypted TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.user_id,
    sp.company_name,
    sp.industry,
    sp.description,
    xot.x_username,
    xot.access_token_encrypted
  FROM posting_schedule ps
  INNER JOIN startup_profiles sp ON ps.user_id = sp.user_id
  INNER JOIN x_oauth_tokens xot ON ps.user_id = xot.user_id
  WHERE ps.is_active = true
    AND ps.next_post_at <= NOW()
    AND xot.token_expires_at > NOW()
    AND NOT EXISTS (
      SELECT 1 FROM post_history ph
      WHERE ph.user_id = ps.user_id
        AND DATE(ph.posted_at) = CURRENT_DATE
        AND ph.status = 'success'
    );
END;
$$;

-- Function to update next post time after successful post
CREATE OR REPLACE FUNCTION update_next_post_time(p_user_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE posting_schedule
  SET 
    last_posted_at = NOW(),
    next_post_at = (NOW() + INTERVAL '1 day')::date + post_time::time,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_startup_profiles_updated_at
  BEFORE UPDATE ON startup_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_x_oauth_tokens_updated_at
  BEFORE UPDATE ON x_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posting_schedule_updated_at
  BEFORE UPDATE ON posting_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

