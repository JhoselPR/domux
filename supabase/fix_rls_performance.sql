-- ============================================
-- Fix: RLS Performance and Recursion Bug
-- ============================================

-- El problema: La función get_my_household_ids() estaba escrita en LANGUAGE SQL.
-- Postgres a veces "inlinea" (fusiona) las funciones SQL por rendimiento.
-- Al hacer eso, pierde el contexto de SECURITY DEFINER y entra en recursión infinita
-- aleatoriamente dependiendo del plan de ejecución que elija la base de datos.
-- Esto causa timeouts y hace que las consultas regresen vacías (cero).

-- Solución: Reescribir la función en LANGUAGE plpgsql.
-- plpgsql NUNCA es inlined por Postgres, garantizando que el SECURITY DEFINER
-- se respete siempre y previniendo la recursión.

create or replace function public.get_user_households(user_id uuid)
returns setof uuid
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  return query
  select household_id
  from public.household_members
  where profile_id = user_id;
end;
$$;

-- Drop de las políticas actuales para actualizarlas con la nueva función
drop policy if exists "households_update" on public.households;
drop policy if exists "households_delete" on public.households;

drop policy if exists "hm_select" on public.household_members;
drop policy if exists "hm_delete" on public.household_members;

drop policy if exists "tasks_select" on public.tasks;
drop policy if exists "tasks_insert" on public.tasks;
drop policy if exists "tasks_update" on public.tasks;
drop policy if exists "tasks_delete" on public.tasks;

drop policy if exists "pantry_select" on public.pantry_items;
drop policy if exists "pantry_insert" on public.pantry_items;
drop policy if exists "pantry_update" on public.pantry_items;
drop policy if exists "pantry_delete" on public.pantry_items;

drop policy if exists "expenses_select" on public.expenses;
drop policy if exists "expenses_insert" on public.expenses;
drop policy if exists "expenses_update" on public.expenses;
drop policy if exists "expenses_delete" on public.expenses;

drop policy if exists "budgets_select" on public.budgets;
drop policy if exists "budgets_insert" on public.budgets;
drop policy if exists "budgets_update" on public.budgets;

-- Recrear usando la nueva función segura (get_user_households)

-- HOUSEHOLDS
create policy "households_update" on public.households
  for update using (id in (select public.get_user_households(auth.uid())));

create policy "households_delete" on public.households
  for delete using (id in (select public.get_user_households(auth.uid())));

-- HOUSEHOLD MEMBERS
create policy "hm_select" on public.household_members
  for select using (
    profile_id = auth.uid()
    or household_id in (select public.get_user_households(auth.uid()))
  );

create policy "hm_delete" on public.household_members
  for delete using (
    profile_id = auth.uid()
    or household_id in (select public.get_user_households(auth.uid()))
  );

-- TASKS
create policy "tasks_select" on public.tasks
  for select using (household_id in (select public.get_user_households(auth.uid())));

create policy "tasks_insert" on public.tasks
  for insert with check (household_id in (select public.get_user_households(auth.uid())));

create policy "tasks_update" on public.tasks
  for update using (household_id in (select public.get_user_households(auth.uid())));

create policy "tasks_delete" on public.tasks
  for delete using (household_id in (select public.get_user_households(auth.uid())));

-- PANTRY ITEMS
create policy "pantry_select" on public.pantry_items
  for select using (household_id in (select public.get_user_households(auth.uid())));

create policy "pantry_insert" on public.pantry_items
  for insert with check (household_id in (select public.get_user_households(auth.uid())));

create policy "pantry_update" on public.pantry_items
  for update using (household_id in (select public.get_user_households(auth.uid())));

create policy "pantry_delete" on public.pantry_items
  for delete using (household_id in (select public.get_user_households(auth.uid())));

-- EXPENSES
create policy "expenses_select" on public.expenses
  for select using (household_id in (select public.get_user_households(auth.uid())));

create policy "expenses_insert" on public.expenses
  for insert with check (household_id in (select public.get_user_households(auth.uid())));

create policy "expenses_update" on public.expenses
  for update using (household_id in (select public.get_user_households(auth.uid())));

create policy "expenses_delete" on public.expenses
  for delete using (household_id in (select public.get_user_households(auth.uid())));

-- BUDGETS
create policy "budgets_select" on public.budgets
  for select using (household_id in (select public.get_user_households(auth.uid())));

create policy "budgets_insert" on public.budgets
  for insert with check (household_id in (select public.get_user_households(auth.uid())));

create policy "budgets_update" on public.budgets
  for update using (household_id in (select public.get_user_households(auth.uid())));
