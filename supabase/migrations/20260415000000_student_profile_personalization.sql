-- Migration: Student Profile & Personalization Foundation
-- Extends public.profiles with academic details, target career role, structured skills, and baseline readiness levels.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS degree text DEFAULT '',
  ADD COLUMN IF NOT EXISTS semester text DEFAULT '',
  ADD COLUMN IF NOT EXISTS graduation_year text DEFAULT '',
  ADD COLUMN IF NOT EXISTS target_role text DEFAULT '',
  ADD COLUMN IF NOT EXISTS target_companies text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS dsa_level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cs_fundamentals_level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS aptitude_level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS communication_level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- RLS policies remain in effect for public.profiles (SELECT authenticated, UPDATE auth.uid() = id, INSERT auth.uid() = id)
-- Refresh trigger function to preserve default values on auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, domain, onboarding_completed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'domain', 'engineering'),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
