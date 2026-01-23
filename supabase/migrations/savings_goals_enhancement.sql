-- =============================================================================
-- SAVINGS GOALS ENHANCEMENT - Add savings frequency and destination linking
-- =============================================================================

-- Add new columns to trips table for enhanced savings goals
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS destination_id uuid REFERENCES public.destinations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_custom_goal boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS savings_frequency text DEFAULT 'monthly' CHECK (savings_frequency IN ('daily', 'weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS daily_target decimal(10,2),
ADD COLUMN IF NOT EXISTS weekly_target decimal(10,2),
ADD COLUMN IF NOT EXISTS monthly_target decimal(10,2),
ADD COLUMN IF NOT EXISTS location text;

-- Create index for destination_id lookups
CREATE INDEX IF NOT EXISTS trips_destination_id_idx ON public.trips(destination_id);
CREATE INDEX IF NOT EXISTS trips_is_custom_goal_idx ON public.trips(is_custom_goal);

-- =============================================================================
-- DONE
-- =============================================================================
