-- Add website_url column to events table
ALTER TABLE public.events
ADD COLUMN website_url TEXT;

-- Optional: Add a comment to describe the column
COMMENT ON COLUMN public.events.website_url IS 'The official website or registration page link for the event';
