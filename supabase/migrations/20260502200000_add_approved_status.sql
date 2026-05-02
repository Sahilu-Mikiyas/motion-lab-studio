-- Add 'approved' to onboarding_status enum
ALTER TYPE public.onboarding_status ADD VALUE IF NOT EXISTS 'approved';
