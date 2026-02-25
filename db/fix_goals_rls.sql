-- FIX: GOALS TABLE RECURSION
-- Similar to budgets/accounts, we need to break the recursion for Goals policies.

-- 1. Helper Function: Get Goals accessible by current user (Owner or Member)
create or replace function public.get_accessible_goal_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  -- Goals where I am a member
  select goal_id from goal_members where user_id = auth.uid()
  union
  -- Goals where I am the owner (user_id field)
  select id from goals where user_id = auth.uid(); 
$$;

-- 2. Update Goals Policy (Select)
-- Clean up potential old policies first
drop policy if exists "Users can view goals they belong to" on goals;
drop policy if exists "Members can view shared goals" on goals;
drop policy if exists "Users can view accessible goals" on goals;

create policy "Users can view accessible goals" on goals
  for select using (
    id in (select public.get_accessible_goal_ids())
  );

-- 3. Update Goals Policy (Modification)
-- Owners can do everything
create policy "Owners can update goals" on goals
  for update using (user_id = auth.uid());

create policy "Owners can delete goals" on goals
  for delete using (user_id = auth.uid());

create policy "Users can insert goals" on goals
  for insert with check (user_id = auth.uid());

-- 4. Update Goal Members Policy
drop policy if exists "Members can view other members" on goal_members;
drop policy if exists "Members can view other goal members" on goal_members;

create policy "Members can view other goal members" on goal_members
  for select using (
    goal_id in (select public.get_accessible_goal_ids())
  );
