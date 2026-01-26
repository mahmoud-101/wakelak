-- ================================================
-- SECURITY FIX: Move GitHub tokens to secure storage
-- ================================================

-- Step 1: Create secure_credentials table for sensitive data
CREATE TABLE IF NOT EXISTS public.secure_credentials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_token TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on secure_credentials
ALTER TABLE public.secure_credentials ENABLE ROW LEVEL SECURITY;

-- Only service role can access - users CANNOT read tokens
CREATE POLICY "Service role can manage credentials"
  ON public.secure_credentials
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Step 2: Migrate existing tokens from profiles to secure_credentials
INSERT INTO public.secure_credentials (user_id, github_token)
SELECT id, github_token 
FROM public.profiles 
WHERE github_token IS NOT NULL
ON CONFLICT (user_id) DO UPDATE 
SET github_token = EXCLUDED.github_token;

-- Step 3: Remove github_token column from profiles (exposed to users)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS github_token;

-- ================================================
-- FIX: Add missing UPDATE/DELETE policies for deployments
-- ================================================

CREATE POLICY "Users can update deployments of their projects"
  ON public.deployments
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = deployments.project_id
    AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete deployments of their projects"
  ON public.deployments
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = deployments.project_id
    AND projects.user_id = auth.uid()
  ));

-- ================================================
-- FIX: Add trigger for secure_credentials updated_at
-- ================================================

CREATE TRIGGER update_secure_credentials_updated_at
  BEFORE UPDATE ON public.secure_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();