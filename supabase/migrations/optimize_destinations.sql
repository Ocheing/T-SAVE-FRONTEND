-- Optimizing Destinations Table Performance
-- Adding indexes for frequently accessed columns to speed up querying

-- Index for filtering by status (published, draft, archived)
-- Used in user-facing pages (status='published') and admin filtering
CREATE INDEX IF NOT EXISTS idx_destinations_status ON public.destinations(status);

-- Index for Created At (for sorting)
-- Used in Admin Dashboard default view
CREATE INDEX IF NOT EXISTS idx_destinations_created_at ON public.destinations(created_at DESC);

-- Index for Featured Destinations
-- Used in Landing Page and Destinations Page
CREATE INDEX IF NOT EXISTS idx_destinations_featured ON public.destinations(is_featured) WHERE is_featured = true;

-- Index for Popular Destinations
-- Used in Landing Page and Destinations Page
CREATE INDEX IF NOT EXISTS idx_destinations_popular ON public.destinations(is_popular) WHERE is_popular = true;

-- Index for Sorting by Rating (Featured uses this)
CREATE INDEX IF NOT EXISTS idx_destinations_rating ON public.destinations(rating DESC);

-- Index for Sorting by Reviews (Popular uses this)
CREATE INDEX IF NOT EXISTS idx_destinations_reviews ON public.destinations(reviews_count DESC);

-- Composite Index for Admin Filtering (Status + Date)
CREATE INDEX IF NOT EXISTS idx_destinations_status_created ON public.destinations(status, created_at DESC);
