-- =============================================================================
-- Smart Trip Savings App - Complete Database Schema
-- Run this SQL in your Supabase SQL Editor (Project Dashboard > SQL Editor)
-- =============================================================================

-- =============================================================================
-- 1. PROFILES TABLE
-- Extends Supabase auth.users with additional user information
-- =============================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  phone text,
  location text,
  avatar_url text,
  language text default 'en',
  currency text default 'kes',
  travel_preferences text[],
  email_notifications boolean default true,
  trip_reminders boolean default true,
  savings_milestones boolean default true,
  id_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index for faster email lookups
create index if not exists profiles_email_idx on public.profiles(email);

-- =============================================================================
-- 2. PAYMENT METHODS TABLE
-- Stores user's payment methods (M-Pesa, Card, Bank)
-- =============================================================================
create table if not exists public.payment_methods (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('mpesa', 'card', 'bank')),
  name text not null,
  details jsonb not null default '{}',
  is_default boolean default false,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists payment_methods_user_id_idx on public.payment_methods(user_id);

-- =============================================================================
-- 3. TRIPS TABLE
-- Stores user's savings goals for trips and events
-- =============================================================================
create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  destination text not null,
  description text,
  category text check (category in ('beach', 'mountain', 'city', 'adventure', 'cultural', 'event')),
  goal_type text default 'flexible' check (goal_type in ('flexible', 'locked')),
  event_type text check (event_type in ('concert', 'festival', 'sports', 'conference', 'other')),
  ticket_type text,
  event_organizer text,
  image_url text,
  target_amount decimal(10,2) not null check (target_amount > 0),
  saved_amount decimal(10,2) default 0 check (saved_amount >= 0),
  target_date date not null,
  status text default 'active' check (status in ('active', 'completed', 'cancelled')),
  reviews_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for faster queries
create index if not exists trips_user_id_idx on public.trips(user_id);
create index if not exists trips_status_idx on public.trips(status);
create index if not exists trips_goal_type_idx on public.trips(goal_type);

-- =============================================================================
-- 4. WISHLIST TABLE
-- Stores destinations users want to save for later
-- =============================================================================
create table if not exists public.wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  destination text not null,
  description text,
  category text check (category in ('beach', 'mountain', 'city', 'adventure', 'cultural', 'event')),
  estimated_cost decimal(10,2),
  duration text,
  image_url text,
  notes text,
  reviews_count integer default 0,
  created_at timestamptz default now()
);

-- Create index for faster user lookups
create index if not exists wishlist_user_id_idx on public.wishlist(user_id);

-- =============================================================================
-- 5. TRANSACTIONS TABLE
-- Tracks all financial transactions (deposits, withdrawals, payments)
-- =============================================================================
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  trip_id uuid references public.trips(id) on delete set null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  type text not null check (type in ('deposit', 'withdrawal', 'booking_payment', 'refund')),
  amount decimal(10,2) not null check (amount > 0),
  description text,
  status text default 'completed' check (status in ('pending', 'completed', 'failed', 'cancelled')),
  created_at timestamptz default now()
);

-- Create indexes for faster queries
create index if not exists transactions_user_id_idx on public.transactions(user_id);
create index if not exists transactions_trip_id_idx on public.transactions(trip_id);
create index if not exists transactions_created_at_idx on public.transactions(created_at desc);

-- =============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures users can only access their own data
-- =============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.payment_methods enable row level security;
alter table public.trips enable row level security;
alter table public.wishlist enable row level security;
alter table public.transactions enable row level security;

-- PROFILES POLICIES
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- PAYMENT METHODS POLICIES
create policy "Users can view own payment methods"
  on public.payment_methods for select using (auth.uid() = user_id);

create policy "Users can insert own payment methods"
  on public.payment_methods for insert with check (auth.uid() = user_id);

create policy "Users can update own payment methods"
  on public.payment_methods for update using (auth.uid() = user_id);

create policy "Users can delete own payment methods"
  on public.payment_methods for delete using (auth.uid() = user_id);

-- TRIPS POLICIES
create policy "Users can view own trips"
  on public.trips for select using (auth.uid() = user_id);

create policy "Users can insert own trips"
  on public.trips for insert with check (auth.uid() = user_id);

create policy "Users can update own trips"
  on public.trips for update using (auth.uid() = user_id);

create policy "Users can delete own trips"
  on public.trips for delete using (auth.uid() = user_id);

-- WISHLIST POLICIES
create policy "Users can view own wishlist"
  on public.wishlist for select using (auth.uid() = user_id);

create policy "Users can insert own wishlist"
  on public.wishlist for insert with check (auth.uid() = user_id);

create policy "Users can update own wishlist"
  on public.wishlist for update using (auth.uid() = user_id);

create policy "Users can delete own wishlist"
  on public.wishlist for delete using (auth.uid() = user_id);

-- TRANSACTIONS POLICIES
create policy "Users can view own transactions"
  on public.transactions for select using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert with check (auth.uid() = user_id);

-- =============================================================================
-- 7. FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger on_trips_updated
  before update on public.trips
  for each row execute function public.handle_updated_at();

create trigger on_payment_methods_updated
  before update on public.payment_methods
  for each row execute function public.handle_updated_at();

-- Function to create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, phone, id_number)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'id_number'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function to update trip saved_amount when transaction is added
create or replace function public.update_trip_saved_amount()
returns trigger as $$
begin
  if new.trip_id is not null and new.status = 'completed' then
    if new.type = 'deposit' then
      update public.trips
      set saved_amount = saved_amount + new.amount
      where id = new.trip_id;
    elsif new.type in ('withdrawal', 'booking_payment') then
      update public.trips
      set saved_amount = saved_amount - new.amount
      where id = new.trip_id;
    elsif new.type = 'refund' then
      update public.trips
      set saved_amount = saved_amount + new.amount
      where id = new.trip_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for automatic saved_amount updates
create trigger on_transaction_created
  after insert on public.transactions
  for each row execute function public.update_trip_saved_amount();

-- Function to check if withdrawal is allowed (for locked goals)
create or replace function public.can_withdraw(trip_id uuid, amount decimal)
returns boolean as $$
declare
  trip_record record;
begin
  select * into trip_record from public.trips where id = trip_id;
  
  if trip_record is null then
    return false;
  end if;
  
  -- For locked goals, can only withdraw if goal is reached
  if trip_record.goal_type = 'locked' then
    return trip_record.saved_amount >= trip_record.target_amount;
  end if;
  
  -- For flexible goals, can withdraw if enough balance
  return trip_record.saved_amount >= amount;
end;
$$ language plpgsql security definer;

-- =============================================================================
-- 6. APP REVIEWS TABLE
-- =============================================================================
create table if not exists public.app_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  is_public boolean default true,
  created_at timestamptz default now()
);

-- RLS
alter table public.app_reviews enable row level security;

create policy "Users can insert own reviews"
  on public.app_reviews for insert with check (auth.uid() = user_id);

create policy "Public can view reviews"
  on public.app_reviews for select using (is_public = true);

-- =============================================================================
-- 7. DESTINATIONS TABLE (Catalog)
-- Centralized store for all available trips for users to browse and save for
-- =============================================================================
create table if not exists public.destinations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  location text,
  description text,
  categories text[] default '{}',
  estimated_cost decimal(10,2) not null,
  duration text,
  image_url text,
  rating decimal(3,2) default 0,
  reviews_count integer default 0,
  is_featured boolean default false,
  is_popular boolean default false,
  popularity_badge text, -- e.g., 'Trending', 'Hot'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for Destinations
alter table public.destinations enable row level security;

create policy "Anyone can view destinations"
  on public.destinations for select using (true);

-- Trigger for updated_at
create trigger on_destinations_updated
  before update on public.destinations
  for each row execute function public.handle_updated_at();

-- =============================================================================
-- 8. EVENTS TABLE (Catalog)
-- Categorized events for users to discover and save for
-- =============================================================================
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  location text not null,
  description text,
  categories text[] default '{}', -- e.g., {'Music', 'Cultural', 'Sports'}
  event_date timestamptz not null,
  price decimal(10,2) not null,
  image_url text,
  is_featured boolean default false,
  is_trending boolean default false,
  is_seasonal boolean default false,
  engagement_score integer default 0, -- To track trending status algorithmically
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for Events
alter table public.events enable row level security;

create policy "Anyone can view events"
  on public.events for select using (true);

-- Trigger for updated_at
create trigger on_events_updated
  before update on public.events
  for each row execute function public.handle_updated_at();
