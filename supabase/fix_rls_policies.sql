-- ============================================
-- Fix: Infinite Recursion in RLS Policies
-- Run this in Supabase SQL Editor
-- ============================================

-- The problem: household_members SELECT policy queries 
-- household_members itself, causing infinite recursion.
-- Solution: Use simpler policies that don't self-reference.

-- =====================
-- Drop old policies
-- =====================

-- household_members
drop policy if exists "Members can view members of their households" on public.household_members;
drop policy if exists "Authenticated users can join households" on public.household_members;
drop policy if exists "Admins can delete members" on public.household_members;

-- households
drop policy if exists "Members can view their households" on public.households;
drop policy if exists "Authenticated users can create households" on public.households;
drop policy if exists "Admins can update their households" on public.households;
drop policy if exists "Admins can delete their households" on public.households;
drop policy if exists "Anyone authenticated can read by invite code" on public.households;

-- tasks
drop policy if exists "Members can view tasks in their households" on public.tasks;
drop policy if exists "Members can create tasks in their households" on public.tasks;
drop policy if exists "Members can update tasks in their households" on public.tasks;
drop policy if exists "Members can delete tasks in their households" on public.tasks;

-- pantry_items
drop policy if exists "Members can view pantry items" on public.pantry_items;
drop policy if exists "Members can add pantry items" on public.pantry_items;
drop policy if exists "Members can update pantry items" on public.pantry_items;
drop policy if exists "Members can delete pantry items" on public.pantry_items;

-- expenses
drop policy if exists "Members can view expenses" on public.expenses;
drop policy if exists "Members can add expenses" on public.expenses;
drop policy if exists "Members can update expenses" on public.expenses;
drop policy if exists "Members can delete expenses" on public.expenses;

-- budgets
drop policy if exists "Members can view budgets" on public.budgets;
drop policy if exists "Members can create budgets" on public.budgets;
drop policy if exists "Members can update budgets" on public.budgets;

-- profiles
drop policy if exists "Users can view profiles in their households" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;


-- =============================================
-- Helper function to get user's household IDs
-- Uses SECURITY DEFINER to bypass RLS
-- =============================================
create or replace function public.get_my_household_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select household_id
  from public.household_members
  where profile_id = auth.uid();
$$;


-- =====================
-- NEW POLICIES
-- =====================

-- PROFILES
create policy "profiles_select" on public.profiles
  for select using (true);

create policy "profiles_insert" on public.profiles
  for insert with check (id = auth.uid());

create policy "profiles_update" on public.profiles
  for update using (id = auth.uid());

-- HOUSEHOLDS
create policy "households_select" on public.households
  for select using (true);

create policy "households_insert" on public.households
  for insert with check (auth.uid() = created_by);

create policy "households_update" on public.households
  for update using (id in (select public.get_my_household_ids()));

create policy "households_delete" on public.households
  for delete using (id in (select public.get_my_household_ids()));

-- HOUSEHOLD MEMBERS (the critical one - no self-reference!)
create policy "hm_select" on public.household_members
  for select using (
    profile_id = auth.uid()
    or household_id in (select public.get_my_household_ids())
  );

create policy "hm_insert" on public.household_members
  for insert with check (profile_id = auth.uid());

create policy "hm_delete" on public.household_members
  for delete using (
    profile_id = auth.uid()
    or household_id in (select public.get_my_household_ids())
  );

-- TASKS
create policy "tasks_select" on public.tasks
  for select using (household_id in (select public.get_my_household_ids()));

create policy "tasks_insert" on public.tasks
  for insert with check (household_id in (select public.get_my_household_ids()));

create policy "tasks_update" on public.tasks
  for update using (household_id in (select public.get_my_household_ids()));

create policy "tasks_delete" on public.tasks
  for delete using (household_id in (select public.get_my_household_ids()));

-- PANTRY ITEMS
create policy "pantry_select" on public.pantry_items
  for select using (household_id in (select public.get_my_household_ids()));

create policy "pantry_insert" on public.pantry_items
  for insert with check (household_id in (select public.get_my_household_ids()));

create policy "pantry_update" on public.pantry_items
  for update using (household_id in (select public.get_my_household_ids()));

create policy "pantry_delete" on public.pantry_items
  for delete using (household_id in (select public.get_my_household_ids()));

-- EXPENSES
create policy "expenses_select" on public.expenses
  for select using (household_id in (select public.get_my_household_ids()));

create policy "expenses_insert" on public.expenses
  for insert with check (household_id in (select public.get_my_household_ids()));

create policy "expenses_update" on public.expenses
  for update using (household_id in (select public.get_my_household_ids()));

create policy "expenses_delete" on public.expenses
  for delete using (household_id in (select public.get_my_household_ids()));

-- BUDGETS
create policy "budgets_select" on public.budgets
  for select using (household_id in (select public.get_my_household_ids()));

create policy "budgets_insert" on public.budgets
  for insert with check (household_id in (select public.get_my_household_ids()));

create policy "budgets_update" on public.budgets
  for update using (household_id in (select public.get_my_household_ids()));
