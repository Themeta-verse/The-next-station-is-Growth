-- Migration: Complete Onboarding Profile Schema & Attributes
-- Ensures public.profiles contains all attributes required by the 6-step onboarding workflow.
-- Idempotent and non-destructive: uses ADD COLUMN IF NOT EXISTS with safe defaults.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS degree text DEFAULT '',
  ADD COLUMN IF NOT EXISTS year text DEFAULT '',
  ADD COLUMN IF NOT EXISTS semester text DEFAULT '',
  ADD COLUMN IF NOT EXISTS graduation_year text DEFAULT '',
  ADD COLUMN IF NOT EXISTS preparing_for text DEFAULT '',
  ADD COLUMN IF NOT EXISTS target_role text DEFAULT '',
  ADD COLUMN IF NOT EXISTS target_job_type text DEFAULT 'Full-time',
  ADD COLUMN IF NOT EXISTS target_goal text DEFAULT 'Campus placement',
  ADD COLUMN IF NOT EXISTS target_companies text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS target_salary text DEFAULT '',
  ADD COLUMN IF NOT EXISTS timeline text DEFAULT '6',
  ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS experience jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS topic_competencies jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS baseline_assessment jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS personality_trait text DEFAULT '',
  ADD COLUMN IF NOT EXISTS dsa_level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cs_fundamentals_level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS aptitude_level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS communication_level text DEFAULT '',
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Trigger function to ensure new auth signups initialize onboarding_completed as false
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
