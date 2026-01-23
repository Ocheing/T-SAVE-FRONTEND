-- =============================================================================
-- MIGRATION: Add status column to destinations table
-- Run this in your Supabase SQL Editor if you already have the destinations table
-- =============================================================================

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'destinations' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.destinations 
        ADD COLUMN status text DEFAULT 'published' 
        CHECK (status IN ('draft', 'published', 'archived'));
        
        RAISE NOTICE 'Added status column to destinations table';
    ELSE
        RAISE NOTICE 'Status column already exists in destinations table';
    END IF;
END
$$;

-- Update existing rows to have 'published' status if null
UPDATE public.destinations SET status = 'published' WHERE status IS NULL;

-- =============================================================================
-- DONE
-- =============================================================================
