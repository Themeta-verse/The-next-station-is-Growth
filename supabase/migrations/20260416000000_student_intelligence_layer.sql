-- Migration: Student Intelligence Layer & Comprehensive Preparation Model
-- Extends public.profiles with detailed career targets, granular topic competencies, verified experience, baseline assessments, and behavioral traits.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preparing_for text DEFAULT '',
  ADD COLUMN IF NOT EXISTS target_job_type text DEFAULT 'Full-time',
  ADD COLUMN IF NOT EXISTS target_goal text DEFAULT 'Campus placement',
  ADD COLUMN IF NOT EXISTS topic_competencies jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS experience jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS baseline_assessment jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS personality_trait text DEFAULT '';
