-- Add GitHub authentication fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS github_token TEXT,
ADD COLUMN IF NOT EXISTS github_username TEXT,
ADD COLUMN IF NOT EXISTS github_connected_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster GitHub user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_github_username ON profiles(github_username);

-- Create table for storing GitHub repository connections
CREATE TABLE IF NOT EXISTS github_repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  repo_name TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  default_branch TEXT DEFAULT 'main',
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, repo_owner, repo_name)
);

-- Enable RLS for github_repos
ALTER TABLE github_repos ENABLE ROW LEVEL SECURITY;

-- RLS policies for github_repos
CREATE POLICY "Users can view their own repos"
  ON github_repos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own repos"
  ON github_repos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repos"
  ON github_repos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own repos"
  ON github_repos FOR DELETE
  USING (auth.uid() = user_id);