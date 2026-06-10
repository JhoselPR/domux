-- ============================================
-- Domux - Profile Auto-Creation Trigger
-- Run this AFTER the main migration.sql
-- ============================================

-- This function automatically creates a profile
-- when a new user signs up via Supabase Auth.
-- It runs with elevated privileges (SECURITY DEFINER)
-- bypassing RLS so the profile can always be created.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Usuario'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: fires after a new user is inserted in auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
