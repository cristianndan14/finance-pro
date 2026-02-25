-- ============================================================
-- FIX: Goals RLS sin goal_members
-- Goals are now personal (1 owner, no shared members).
-- This replaces the broken get_accessible_goal_ids() function
-- that referenced the non-existent goal_members table.
-- ============================================================

-- 1. Add account_id column if it doesn't already exist
alter table public.goals
  add column if not exists account_id uuid references public.accounts(id) on delete set null;

-- 2. Drop policies that depend on the broken function FIRST
drop policy if exists "Users can view accessible goals"            on public.goals;
drop policy if exists "Members can view other goal members"        on public.goal_members;
drop policy if exists "Members can view other members"             on public.goal_members;

-- Then drop the broken helper function (CASCADE handles anything left)
drop function if exists public.get_accessible_goal_ids() cascade;

-- 3. Drop ALL existing goals policies to start clean
drop policy if exists "Users can view their own goals"         on public.goals;
drop policy if exists "Users can view goals they belong to"    on public.goals;
drop policy if exists "Members can view shared goals"          on public.goals;
drop policy if exists "Users can view accessible goals"        on public.goals;
drop policy if exists "Owners can update goals"                on public.goals;
drop policy if exists "Owners can delete goals"                on public.goals;
drop policy if exists "Users can insert goals"                 on public.goals;
drop policy if exists "Users can insert their own goals"       on public.goals;
drop policy if exists "Users can update their own goals"       on public.goals;
drop policy if exists "Users can delete their own goals"       on public.goals;

-- 4. Create simple, clean policies (owner-only, no recursion)
create policy "goals_select" on public.goals
  for select using (auth.uid() = user_id);

create policy "goals_insert" on public.goals
  for insert with check (auth.uid() = user_id);

create policy "goals_update" on public.goals
  for update using (auth.uid() = user_id);

create policy "goals_delete" on public.goals
  for delete using (auth.uid() = user_id);

-- 5. Make sure RLS is enabled
alter table public.goals enable row level security;
