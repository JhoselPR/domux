-- ============================================
-- Domux Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  avatar_url text,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view profiles in their households"
  on public.profiles for select
  using (
    id = auth.uid()
    or id in (
      select hm.profile_id from public.household_members hm
      where hm.household_id in (
        select hm2.household_id from public.household_members hm2
        where hm2.profile_id = auth.uid()
      )
    )
  );

create policy "Users can update own profile"
  on public.profiles for update using (id = auth.uid());

create policy "Users can insert own profile"
  on public.profiles for insert with check (id = auth.uid());

-- ============================================
-- HOUSEHOLDS
-- ============================================
create table public.households (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text not null unique,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null
);

alter table public.households enable row level security;

create policy "Members can view their households"
  on public.households for select
  using (
    id in (
      select household_id from public.household_members
      where profile_id = auth.uid()
    )
  );

create policy "Authenticated users can create households"
  on public.households for insert
  with check (auth.uid() = created_by);

create policy "Admins can update their households"
  on public.households for update
  using (
    id in (
      select household_id from public.household_members
      where profile_id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete their households"
  on public.households for delete
  using (
    id in (
      select household_id from public.household_members
      where profile_id = auth.uid() and role = 'admin'
    )
  );

-- Allow reading household by invite_code for joining
create policy "Anyone authenticated can read by invite code"
  on public.households for select
  using (auth.uid() is not null);

-- ============================================
-- HOUSEHOLD MEMBERS
-- ============================================
create table public.household_members (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('admin', 'member')) default 'member' not null,
  joined_at timestamptz default now() not null,
  unique(household_id, profile_id)
);

alter table public.household_members enable row level security;

create policy "Members can view members of their households"
  on public.household_members for select
  using (
    household_id in (
      select household_id from public.household_members
      where profile_id = auth.uid()
    )
  );

create policy "Authenticated users can join households"
  on public.household_members for insert
  with check (profile_id = auth.uid());

create policy "Admins can delete members"
  on public.household_members for delete
  using (
    household_id in (
      select household_id from public.household_members
      where profile_id = auth.uid() and role = 'admin'
    )
    or profile_id = auth.uid()
  );

-- ============================================
-- TASKS
-- ============================================
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households(id) on delete cascade not null,
  title text not null,
  description text,
  status text check (status in ('pending', 'completed')) default 'pending' not null,
  assigned_to uuid references public.profiles(id),
  due_date date,
  is_recurring boolean default false not null,
  recurring_days text[] default '{}' not null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null
);

alter table public.tasks enable row level security;

create policy "Members can view tasks in their households"
  on public.tasks for select
  using (
    household_id in (
      select household_id from public.household_members
      where profile_id = auth.uid()
    )
  );

create policy "Members can create tasks in their households"
  on public.tasks for insert
  with check (
    household_id in (
      select household_id from public.household_members
      where profile_id = auth.uid()
    )
  );

create policy "Members can update tasks in their households"
  on public.tasks for update
  using (
    household_id in (
      select household_id from public.household_members
      where profile_id = auth.uid()
    )
  );

create policy "Members can delete tasks in their households"
  on public.tasks for delete
  using (
    household_id in (
      select household_id from public.household_members
      where profile_id = auth.uid()
    )
  );

-- ============================================
-- PANTRY ITEMS
-- ============================================
create table public.pantry_items (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households(id) on delete cascade not null,
  name text not null,
  quantity integer default 1 not null,
  is_bought boolean default false not null,
  price numeric(10,2),
  added_by uuid references public.profiles(id) not null,
  bought_at timestamptz,
  created_at timestamptz default now() not null
);

alter table public.pantry_items enable row level security;

create policy "Members can view pantry items"
  on public.pantry_items for select
  using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));

create policy "Members can add pantry items"
  on public.pantry_items for insert
  with check (household_id in (select household_id from public.household_members where profile_id = auth.uid()));

create policy "Members can update pantry items"
  on public.pantry_items for update
  using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));

create policy "Members can delete pantry items"
  on public.pantry_items for delete
  using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));

-- ============================================
-- EXPENSES
-- ============================================
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households(id) on delete cascade not null,
  category text check (category in ('electricity', 'phone', 'internet', 'water', 'gas', 'rent', 'other')) not null,
  amount numeric(10,2) not null,
  date date not null,
  description text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null
);

alter table public.expenses enable row level security;

create policy "Members can view expenses"
  on public.expenses for select
  using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));

create policy "Members can add expenses"
  on public.expenses for insert
  with check (household_id in (select household_id from public.household_members where profile_id = auth.uid()));

create policy "Members can update expenses"
  on public.expenses for update
  using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));

create policy "Members can delete expenses"
  on public.expenses for delete
  using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));

-- ============================================
-- BUDGETS
-- ============================================
create table public.budgets (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households(id) on delete cascade not null,
  period_type text check (period_type in ('weekly', 'biweekly', 'monthly')) default 'monthly' not null,
  amount numeric(10,2) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique(household_id)
);

alter table public.budgets enable row level security;

create policy "Members can view budgets"
  on public.budgets for select
  using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));

create policy "Members can create budgets"
  on public.budgets for insert
  with check (household_id in (select household_id from public.household_members where profile_id = auth.uid()));

create policy "Members can update budgets"
  on public.budgets for update
  using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));
