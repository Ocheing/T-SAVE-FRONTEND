-- =============================================================================
-- ADMIN AUTHORIZATION & ROLE MANAGEMENT (SAFE + PRODUCTION READY)
-- =============================================================================

-- 1. Create enum for admin roles (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'admin_role'
    ) THEN
        CREATE TYPE public.admin_role AS ENUM ('admin', 'super_admin');
    END IF;
END
$$;

-- =============================================================================
-- 2. Create admin_users table
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.admin_role NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- 3. Enable Row Level Security
-- =============================================================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. Helper functions (SECURE — NO user_id PARAMS)
-- =============================================================================

-- Check if current user is an admin
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

-- Check if current user is a super admin
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

-- Allow authenticated users to execute helper functions
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin TO authenticated;

-- =============================================================================
-- 5. RLS POLICIES FOR admin_users
-- =============================================================================

-- Super admins: full access
DROP POLICY IF EXISTS "Super admins manage admin users" ON public.admin_users;
CREATE POLICY "Super admins manage admin users"
ON public.admin_users
FOR ALL
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Admins: view own record only
DROP POLICY IF EXISTS "Admins view own admin record" ON public.admin_users;
CREATE POLICY "Admins view own admin record"
ON public.admin_users
FOR SELECT
USING (auth.uid() = id);

-- Prevent deleting yourself (safety)
DROP POLICY IF EXISTS "Prevent self delete" ON public.admin_users;
CREATE POLICY "Prevent self delete"
ON public.admin_users
FOR DELETE
USING (id <> auth.uid());

-- =============================================================================
-- 6. ADMIN ACCESS TO APP TABLES
-- =============================================================================

-- Destinations
DROP POLICY IF EXISTS "Admins manage destinations" ON public.destinations;
CREATE POLICY "Admins manage destinations"
ON public.destinations
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Events
DROP POLICY IF EXISTS "Admins manage events" ON public.events;
CREATE POLICY "Admins manage events"
ON public.events
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Profiles
DROP POLICY IF EXISTS "Admins view profiles" ON public.profiles;
CREATE POLICY "Admins view profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;
CREATE POLICY "Admins update profiles"
ON public.profiles
FOR UPDATE
USING (public.is_admin());

-- Trips
DROP POLICY IF EXISTS "Admins view trips" ON public.trips;
CREATE POLICY "Admins view trips"
ON public.trips
FOR SELECT
USING (public.is_admin());

-- Transactions
DROP POLICY IF EXISTS "Admins view transactions" ON public.transactions;
CREATE POLICY "Admins view transactions"
ON public.transactions
FOR SELECT
USING (public.is_admin());

-- =============================================================================
-- 7. updated_at trigger for admin_users
-- =============================================================================
DROP TRIGGER IF EXISTS on_admin_users_updated ON public.admin_users;

CREATE TRIGGER on_admin_users_updated
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- ✅ DONE
-- =============================================================================
