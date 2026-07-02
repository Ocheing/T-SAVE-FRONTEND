-- =============================================================================
-- ADMIN SYSTEM - COMPLETE SETUP (MERGED & FRESH INSTALL)
-- Drop everything first, then recreate from scratch.
-- Run this ONCE in Supabase SQL Editor.
-- =============================================================================


-- #############################################################################
-- SECTION 0: CLEAN SLATE — DROP EVERYTHING
-- #############################################################################

-- 0a. Drop the admin stats view
DROP VIEW IF EXISTS public.admin_user_stats CASCADE;

-- 0b. Drop all RLS policies on admin_users
DROP POLICY IF EXISTS "Super admins manage admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Admins view own admin record" ON public.admin_users;
DROP POLICY IF EXISTS "Prevent self delete" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can view own role" ON public.admin_users;

-- 0c. Drop admin-specific policies on app tables
DROP POLICY IF EXISTS "Admins manage destinations" ON public.destinations;
DROP POLICY IF EXISTS "Admins can manage destinations" ON public.destinations;
DROP POLICY IF EXISTS "Admins manage events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Admins view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins view trips" ON public.trips;
DROP POLICY IF EXISTS "Admins can view all trips" ON public.trips;
DROP POLICY IF EXISTS "Admins view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all wishlists" ON public.wishlist;
DROP POLICY IF EXISTS "Admins can view all payment methods" ON public.payment_methods;

-- 0d. Drop trigger
DROP TRIGGER IF EXISTS on_admin_users_updated ON public.admin_users;

-- 0e. Drop helper functions
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;

-- 0f. Drop the admin_users table itself
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- 0g. Drop the enum type
DROP TYPE IF EXISTS public.admin_role CASCADE;


-- #############################################################################
-- SECTION 1: ADMIN ROLE ENUM
-- #############################################################################
CREATE TYPE public.admin_role AS ENUM ('admin', 'super_admin');


-- #############################################################################
-- SECTION 2: ADMIN_USERS TABLE
-- #############################################################################
CREATE TABLE public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.admin_role NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;


-- #############################################################################
-- SECTION 3: HELPER FUNCTIONS
-- #############################################################################

-- Check if the current user is any admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
  );
$$;

-- Check if the current user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin TO authenticated;


-- #############################################################################
-- SECTION 4: RLS POLICIES — admin_users TABLE
-- #############################################################################

-- Super admins get full CRUD on admin_users
CREATE POLICY "Super admins manage admin users"
ON public.admin_users
FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Any admin can view their own record
CREATE POLICY "Admins can view own role"
ON public.admin_users
FOR SELECT
USING (auth.uid() = id);

-- Safety: prevent admins from deleting themselves
CREATE POLICY "Prevent self delete"
ON public.admin_users
FOR DELETE
USING (id <> auth.uid());


-- #############################################################################
-- SECTION 5: RLS POLICIES — APP TABLES (admin access)
-- #############################################################################

-- ---- PROFILES ----
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
USING (public.is_admin());

-- ---- TRIPS ----
CREATE POLICY "Admins can view all trips"
ON public.trips FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

-- ---- TRANSACTIONS ----
CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

-- ---- WISHLIST ----
CREATE POLICY "Admins can view all wishlists"
ON public.wishlist FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

-- ---- PAYMENT METHODS ----
CREATE POLICY "Admins can view all payment methods"
ON public.payment_methods FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

-- ---- DESTINATIONS (full manage) ----
CREATE POLICY "Admins can manage destinations"
ON public.destinations FOR ALL
USING (public.is_admin());

-- ---- EVENTS (full manage) ----
CREATE POLICY "Admins can manage events"
ON public.events FOR ALL
USING (public.is_admin());


-- #############################################################################
-- SECTION 6: UPDATED_AT TRIGGER
-- #############################################################################
CREATE TRIGGER on_admin_users_updated
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();


-- #############################################################################
-- SECTION 7: REALTIME
-- #############################################################################
-- Safely add tables to realtime publication (ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE trips;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE destinations;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE wishlist;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- #############################################################################
-- SECTION 8: ADMIN USER STATS VIEW
-- #############################################################################
CREATE OR REPLACE VIEW public.admin_user_stats AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.location,
  p.avatar_url,
  p.id_number,
  p.created_at,
  p.updated_at,
  COALESCE((SELECT COUNT(*) FROM public.trips t WHERE t.user_id = p.id), 0) AS total_trips,
  COALESCE((SELECT SUM(t.saved_amount) FROM public.trips t WHERE t.user_id = p.id), 0) AS total_savings,
  COALESCE((SELECT COUNT(*) FROM public.transactions tr WHERE tr.user_id = p.id), 0) AS total_transactions,
  COALESCE((SELECT COUNT(*) FROM public.wishlist w WHERE w.user_id = p.id), 0) AS wishlist_items
FROM public.profiles p;

-- Grant read access to the view
GRANT SELECT ON public.admin_user_stats TO authenticated;


-- #############################################################################
-- SECTION 9: SEED YOUR ADMIN ACCOUNT
-- Replace YOUR_USER_ID_HERE with your actual auth.users UUID
-- Find it in: Supabase Dashboard > Authentication > Users
-- #############################################################################
-- INSERT INTO public.admin_users (id, role)
-- VALUES ('YOUR_USER_ID_HERE', 'super_admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'super_admin';


-- #############################################################################
-- SECTION 10: VERIFY SETUP
-- Uncomment and run to confirm everything is in place
-- #############################################################################
-- SELECT * FROM public.admin_users;
-- SELECT public.is_admin();
-- SELECT public.is_super_admin();


-- =============================================================================
-- ✅ DONE — Admin system fully installed.
-- Next: Uncomment SECTION 9, paste your user ID, and run it.
-- =============================================================================
