-- =============================================================================
-- Admin RLS Policies - Allow admins to view all user data
-- Run this SQL in your Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- 1. ADMIN_USERS TABLE (if not exists)
-- Stores which users have admin privileges
-- =============================================================================
create table if not exists public.admin_users (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.admin_users enable row level security;

-- Admin can see their own role
create policy if not exists "Admins can view own role"
  on public.admin_users for select using (auth.uid() = id);

-- =============================================================================
-- 2. HELPER FUNCTION - Check if current user is admin
-- =============================================================================
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.admin_users
    where id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- =============================================================================
-- 3. PROFILES - Allow admins to view ALL profiles
-- =============================================================================
-- Drop existing policy if it exists and recreate to allow admin access
drop policy if exists "Admins can view all profiles" on public.profiles;

create policy "Admins can view all profiles"
  on public.profiles for select using (
    auth.uid() = id OR public.is_admin()
  );

-- Allow admins to update any profile
drop policy if exists "Admins can update all profiles" on public.profiles;

create policy "Admins can update all profiles"
  on public.profiles for update using (
    auth.uid() = id OR public.is_admin()
  );

-- Allow admins to delete profiles
drop policy if exists "Admins can delete profiles" on public.profiles;

create policy "Admins can delete profiles"
  on public.profiles for delete using (
    public.is_admin()
  );

-- =============================================================================
-- 4. TRIPS - Allow admins to view ALL trips
-- =============================================================================
drop policy if exists "Admins can view all trips" on public.trips;

create policy "Admins can view all trips"
  on public.trips for select using (
    auth.uid() = user_id OR public.is_admin()
  );

-- =============================================================================
-- 5. TRANSACTIONS - Allow admins to view ALL transactions
-- =============================================================================
drop policy if exists "Admins can view all transactions" on public.transactions;

create policy "Admins can view all transactions"
  on public.transactions for select using (
    auth.uid() = user_id OR public.is_admin()
  );

-- =============================================================================
-- 6. WISHLIST - Allow admins to view ALL wishlists
-- =============================================================================
drop policy if exists "Admins can view all wishlists" on public.wishlist;

create policy "Admins can view all wishlists"
  on public.wishlist for select using (
    auth.uid() = user_id OR public.is_admin()
  );

-- =============================================================================
-- 7. PAYMENT METHODS - Allow admins to view (sensitive - be careful)
-- =============================================================================
drop policy if exists "Admins can view all payment methods" on public.payment_methods;

create policy "Admins can view all payment methods"
  on public.payment_methods for select using (
    auth.uid() = user_id OR public.is_admin()
  );

-- =============================================================================
-- 8. DESTINATIONS - Allow admins to manage destinations
-- =============================================================================
drop policy if exists "Admins can manage destinations" on public.destinations;

create policy "Admins can manage destinations"
  on public.destinations for all using (
    public.is_admin()
  );

-- =============================================================================
-- 9. EVENTS - Allow admins to manage events
-- =============================================================================
drop policy if exists "Admins can manage events" on public.events;

create policy "Admins can manage events"
  on public.events for all using (
    public.is_admin()
  );

-- =============================================================================
-- 10. Enable Realtime for admin relevant tables
-- =============================================================================
-- Enable realtime replication for tables the admin needs to monitor
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table trips;
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table destinations;
alter publication supabase_realtime add table wishlist;

-- =============================================================================
-- 11. Create a view for admin to see user statistics
-- =============================================================================
create or replace view public.admin_user_stats as
select 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.location,
  p.avatar_url,
  p.id_number,
  p.created_at,
  p.updated_at,
  coalesce((select count(*) from public.trips t where t.user_id = p.id), 0) as total_trips,
  coalesce((select sum(t.saved_amount) from public.trips t where t.user_id = p.id), 0) as total_savings,
  coalesce((select count(*) from public.transactions tr where tr.user_id = p.id), 0) as total_transactions,
  coalesce((select count(*) from public.wishlist w where w.user_id = p.id), 0) as wishlist_items
from public.profiles p;

-- Grant access to admin view
grant select on public.admin_user_stats to authenticated;

-- =============================================================================
-- IMPORTANT: Run this to add yourself as an admin (replace YOUR_USER_ID)
-- =============================================================================
-- INSERT INTO public.admin_users (id, role) VALUES ('YOUR_USER_ID_HERE', 'super_admin');
