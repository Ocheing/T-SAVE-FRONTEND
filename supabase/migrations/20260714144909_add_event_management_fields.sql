-- ============================================================================
-- Migration: Add event management fields to events table
-- ============================================================================

-- Add status column for publish workflow (draft -> published -> archived)
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'archived'));

-- Add destination reference (optional link to a destination)
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS destination_id uuid REFERENCES public.destinations(id) ON DELETE SET NULL;

-- Add granular date/time fields
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS start_date date,
    ADD COLUMN IF NOT EXISTS end_date date,
    ADD COLUMN IF NOT EXISTS start_time text,
    ADD COLUMN IF NOT EXISTS end_time text;

-- Add participant capacity
ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS max_participants integer;
