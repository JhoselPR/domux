-- ============================================
-- Domux Task Reminders and Web Push
-- Run this in Supabase SQL Editor after migration.sql
-- ============================================

create extension if not exists "uuid-ossp";

-- ============================================
-- PUSH SUBSCRIPTIONS
-- ============================================
create table if not exists public.push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  last_seen_at timestamptz default now() not null,
  constraint push_subscriptions_endpoint_not_blank check (length(trim(endpoint)) > 0),
  constraint push_subscriptions_p256dh_not_blank check (length(trim(p256dh)) > 0),
  constraint push_subscriptions_auth_not_blank check (length(trim(auth)) > 0)
);

create index if not exists push_subscriptions_profile_active_idx
  on public.push_subscriptions (profile_id, active)
  where active = true;

alter table public.push_subscriptions enable row level security;

create policy "Users can manage own push subscriptions"
  on public.push_subscriptions for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ============================================
-- TASK REMINDERS
-- ============================================
create table if not exists public.task_reminders (
  id uuid default uuid_generate_v4() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  household_id uuid references public.households(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  scheduled_for timestamptz not null,
  status text default 'pending' not null check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  sent_at timestamptz,
  locked_at timestamptz,
  lock_token uuid,
  attempts integer default 0 not null check (attempts >= 0),
  last_error text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint task_reminders_task_recipient_schedule_unique unique (task_id, recipient_id, scheduled_for),
  constraint task_reminders_sent_at_check check (status <> 'sent' or sent_at is not null)
);

create index if not exists task_reminders_due_lookup_idx
  on public.task_reminders (scheduled_for, status)
  where status in ('pending', 'failed', 'processing');

create index if not exists task_reminders_recipient_idx
  on public.task_reminders (recipient_id, scheduled_for desc);

create index if not exists task_reminders_task_idx
  on public.task_reminders (task_id);

alter table public.task_reminders enable row level security;

create policy "Members can view task reminders in their households"
  on public.task_reminders for select
  using (
    household_id in (
      select household_id from public.household_members
      where profile_id = auth.uid()
    )
  );

create policy "Members can create task reminders in their households"
  on public.task_reminders for insert
  with check (
    household_id in (
      select household_id from public.household_members
      where profile_id = auth.uid()
    )
    and exists (
      select 1 from public.tasks t
      where t.id = task_id
        and t.household_id = task_reminders.household_id
    )
    and exists (
      select 1 from public.household_members hm
      where hm.household_id = task_reminders.household_id
        and hm.profile_id = recipient_id
    )
  );

create policy "Members can cancel pending task reminders in their households"
  on public.task_reminders for update
  using (
    status = 'pending'
    and household_id in (
      select household_id from public.household_members
      where profile_id = auth.uid()
    )
  )
  with check (
    status in ('pending', 'cancelled')
    and household_id in (
      select household_id from public.household_members
      where profile_id = auth.uid()
    )
  );

-- ============================================
-- REMINDER CREATION RPC
-- ============================================
create or replace function public.create_task_reminders(
  p_task_id uuid,
  p_timing text default 'due_day',
  p_custom_scheduled_for timestamptz default null
)
returns setof public.task_reminders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks%rowtype;
  v_scheduled_for timestamptz;
begin
  if p_timing not in ('none', 'due_day', 'one_day_before', 'two_days_before', 'custom') then
    raise exception 'Invalid reminder timing: %', p_timing;
  end if;

  select * into v_task
  from public.tasks
  where id = p_task_id;

  if not found then
    raise exception 'Task not found';
  end if;

  if not exists (
    select 1 from public.household_members
    where household_id = v_task.household_id
      and profile_id = auth.uid()
  ) then
    raise exception 'Not allowed to create reminders for this task';
  end if;

  if p_timing = 'none' then
    return;
  end if;

  if p_timing = 'custom' then
    if p_custom_scheduled_for is null then
      raise exception 'Custom reminder requires a scheduled date';
    end if;
    v_scheduled_for := p_custom_scheduled_for;
  else
    if v_task.due_date is null then
      return;
    end if;

    v_scheduled_for := case p_timing
      when 'one_day_before' then (v_task.due_date::timestamptz - interval '1 day') + interval '9 hours'
      when 'two_days_before' then (v_task.due_date::timestamptz - interval '2 days') + interval '9 hours'
      else v_task.due_date::timestamptz + interval '9 hours'
    end;
  end if;

  return query
  insert into public.task_reminders (task_id, household_id, recipient_id, scheduled_for, metadata)
  select
    v_task.id,
    v_task.household_id,
    recipients.profile_id,
    v_scheduled_for,
    jsonb_build_object('timing', p_timing, 'created_by', auth.uid())
  from (
    select v_task.assigned_to as profile_id
    where v_task.assigned_to is not null
      and exists (
        select 1
        from public.household_members assigned_member
        where assigned_member.household_id = v_task.household_id
          and assigned_member.profile_id = v_task.assigned_to
      )
    union
    select hm.profile_id
    from public.household_members hm
    where hm.household_id = v_task.household_id
      and v_task.assigned_to is null
  ) recipients
  on conflict (task_id, recipient_id, scheduled_for) do update
    set status = 'pending',
        sent_at = null,
        locked_at = null,
        lock_token = null,
        last_error = null,
        metadata = excluded.metadata,
        updated_at = now()
  returning *;
end;
$$;

grant execute on function public.create_task_reminders(uuid, text, timestamptz) to authenticated;

-- ============================================
-- SCHEDULER CLAIM RPC
-- ============================================
create or replace function public.claim_due_task_reminders(p_limit integer default 50)
returns table (
  id uuid,
  task_id uuid,
  recipient_id uuid,
  scheduled_for timestamptz,
  attempts integer,
  lock_token uuid,
  task_title text,
  task_due_date date
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select tr.id
    from public.task_reminders tr
    join public.tasks t on t.id = tr.task_id
    where tr.scheduled_for <= now()
      and (
        tr.status in ('pending', 'failed')
        or (tr.status = 'processing' and tr.locked_at < now() - interval '15 minutes')
      )
      and tr.sent_at is null
      and tr.attempts < 3
      and t.status = 'pending'
    order by tr.scheduled_for asc
    limit greatest(1, least(coalesce(p_limit, 50), 100))
    for update of tr skip locked
  ), claimed as (
    update public.task_reminders tr
    set status = 'processing',
        attempts = tr.attempts + 1,
        locked_at = now(),
        lock_token = uuid_generate_v4(),
        updated_at = now()
    from due
    where tr.id = due.id
    returning tr.id, tr.task_id, tr.recipient_id, tr.scheduled_for, tr.attempts, tr.lock_token
  )
  select c.id, c.task_id, c.recipient_id, c.scheduled_for, c.attempts, c.lock_token, t.title, t.due_date
  from claimed c
  join public.tasks t on t.id = c.task_id;
end;
$$;

revoke all on function public.claim_due_task_reminders(integer) from public;
revoke all on function public.claim_due_task_reminders(integer) from anon;
revoke all on function public.claim_due_task_reminders(integer) from authenticated;
grant execute on function public.claim_due_task_reminders(integer) to service_role;

-- Optional pg_cron deployment snippet:
-- 1. Store the function URL and cron secret in Supabase Vault or project env vars.
-- 2. Schedule an HTTP POST without hardcoding secrets in this SQL file.
--
-- select cron.schedule(
--   'send-task-reminders-every-5-minutes',
--   '*/5 * * * *',
--   $$
--   select net.http_post(
--     url := '<SUPABASE_FUNCTION_URL>/send-task-reminders',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || '<REMINDER_CRON_SECRET_FROM_VAULT>'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
