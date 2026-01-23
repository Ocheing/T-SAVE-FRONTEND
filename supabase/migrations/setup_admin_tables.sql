-- =============================================================================
-- ONE-TIME SETUP FOR ADMIN ACCESS
-- Run this in Supabase SQL Editor to enable admin functionality
-- =============================================================================

-- 1. Create the admin_users table if it doesn't exist
create table if not exists public.admin_users (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.admin_users enable row level security;

-- 3. Create view policy
create policy "Admins can view own role"
  on public.admin_users for select using (auth.uid() = id);

-- 4. Create is_admin helper function
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.admin_users
    where id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- 5. IMPORTANT: Add your user as admin
-- Replace 'YOUR_USER_ID_HERE' with your actual User UID
-- You can find your UID and run this in: Supabase Dashboard > SQL Editor

INSERT INTO public.admin_users (id, role) 
VALUES ('YOUR_USER_ID_HERE', 'super_admin')
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

-- 6. Verify setup
select * from public.admin_users;
