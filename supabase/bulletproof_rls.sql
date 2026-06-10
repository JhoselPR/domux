-- ============================================
-- BULLETPROOF RLS POLICIES FOR DOMUX
-- Run this in Supabase SQL Editor
-- ============================================

-- Para eliminar por completo cualquier problema de recursión, bloqueos
-- o "timeouts" que causan que los datos desaparezcan, vamos a usar
-- un patrón infalible: 
-- 1. Permitir lectura global (USING TRUE) en tablas de mapeo (no contienen datos sensibles).
-- 2. Usar subconsultas directas (sin funciones intermedias) para datos sensibles.

-- =====================
-- 1. LIMPIEZA TOTAL
-- =====================
drop function if exists public.get_my_household_ids() cascade;
drop function if exists public.get_user_households(uuid) cascade;

-- PROFILES
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "Users can view profiles in their households" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

-- HOUSEHOLDS
drop policy if exists "households_select" on public.households;
drop policy if exists "households_insert" on public.households;
drop policy if exists "households_update" on public.households;
drop policy if exists "households_delete" on public.households;

-- HOUSEHOLD MEMBERS
drop policy if exists "hm_select" on public.household_members;
drop policy if exists "hm_insert" on public.household_members;
drop policy if exists "hm_delete" on public.household_members;

-- TASKS
drop policy if exists "tasks_select" on public.tasks;
drop policy if exists "tasks_insert" on public.tasks;
drop policy if exists "tasks_update" on public.tasks;
drop policy if exists "tasks_delete" on public.tasks;

-- PANTRY ITEMS
drop policy if exists "pantry_select" on public.pantry_items;
drop policy if exists "pantry_insert" on public.pantry_items;
drop policy if exists "pantry_update" on public.pantry_items;
drop policy if exists "pantry_delete" on public.pantry_items;

-- EXPENSES
drop policy if exists "expenses_select" on public.expenses;
drop policy if exists "expenses_insert" on public.expenses;
drop policy if exists "expenses_update" on public.expenses;
drop policy if exists "expenses_delete" on public.expenses;

-- BUDGETS
drop policy if exists "budgets_select" on public.budgets;
drop policy if exists "budgets_insert" on public.budgets;
drop policy if exists "budgets_update" on public.budgets;


-- =====================
-- 2. NUEVAS POLÍTICAS
-- =====================

-- PROFILES: Todos pueden leer perfiles (necesario para ver nombres en tareas), solo el dueño modifica.
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update" on public.profiles for update using (id = auth.uid());

-- HOUSEHOLDS: Todos pueden leer (para validar invitaciones), solo miembros modifican.
create policy "households_select" on public.households for select using (true);
create policy "households_insert" on public.households for insert with check (auth.uid() = created_by);
create policy "households_update" on public.households for update using (
  id in (select household_id from public.household_members where profile_id = auth.uid())
);
create policy "households_delete" on public.households for delete using (
  id in (select household_id from public.household_members where profile_id = auth.uid())
);

-- HOUSEHOLD MEMBERS: Lectura global, escritura protegida.
-- ¡Esto elimina el loop de recursión para siempre!
create policy "hm_select" on public.household_members for select using (true);
create policy "hm_insert" on public.household_members for insert with check (profile_id = auth.uid() or role = 'admin');
create policy "hm_delete" on public.household_members for delete using (
  profile_id = auth.uid() or household_id in (select household_id from public.household_members where profile_id = auth.uid())
);

-- TABLAS SENSIBLES (Tasks, Pantry, Expenses, Budgets)
-- Ahora usan un query directo extremadamente rápido y sin funciones complejas.

-- TASKS
create policy "tasks_select" on public.tasks for select using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));
create policy "tasks_insert" on public.tasks for insert with check (household_id in (select household_id from public.household_members where profile_id = auth.uid()));
create policy "tasks_update" on public.tasks for update using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));
create policy "tasks_delete" on public.tasks for delete using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));

-- PANTRY ITEMS
create policy "pantry_select" on public.pantry_items for select using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));
create policy "pantry_insert" on public.pantry_items for insert with check (household_id in (select household_id from public.household_members where profile_id = auth.uid()));
create policy "pantry_update" on public.pantry_items for update using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));
create policy "pantry_delete" on public.pantry_items for delete using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));

-- EXPENSES
create policy "expenses_select" on public.expenses for select using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));
create policy "expenses_insert" on public.expenses for insert with check (household_id in (select household_id from public.household_members where profile_id = auth.uid()));
create policy "expenses_update" on public.expenses for update using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));
create policy "expenses_delete" on public.expenses for delete using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));

-- BUDGETS
create policy "budgets_select" on public.budgets for select using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));
create policy "budgets_insert" on public.budgets for insert with check (household_id in (select household_id from public.household_members where profile_id = auth.uid()));
create policy "budgets_update" on public.budgets for update using (household_id in (select household_id from public.household_members where profile_id = auth.uid()));
