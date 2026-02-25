-- FIX: COMPLETE RLS OVERHAUL TO PREVENT RECURSION
-- We replace all self-referencing or circular policies with "Security Definer" functions.
-- These functions run with admin privileges (bypassing RLS) but are safe because they only return data for the current user.

-- 1. Helper Function: Get Budgets accessible by current user
create or replace function public.get_accessible_budget_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select budget_id from budget_members where user_id = auth.uid()
  union
  select id from budgets where owner_id = auth.uid();
$$;

-- 2. Helper Function: Get Accounts accessible by current user (Own + Shared via Budget/Goal)
create or replace function public.get_accessible_account_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  -- Own accounts
  select id from accounts where user_id = auth.uid()
  union
  -- Linked to accessible budgets
  select account_id from budgets 
  where id in (select budget_id from budget_members where user_id = auth.uid())
  and account_id is not null
  union
  -- Linked to accessible goals
  select account_id from goals
  where id in (select goal_id from goal_members where user_id = auth.uid())
  and account_id is not null;
$$;

-- 3. UPDATE POLICIES

-- A. Budget Members (Break self-recursion)
drop policy if exists "Members can view other members" on budget_members;
create policy "Members can view other members" on budget_members
  for select using (
    budget_id in (select public.get_accessible_budget_ids())
  );

-- B. Budgets
drop policy if exists "Users can view budgets they belong to" on budgets;
create policy "Users can view budgets they belong to" on budgets
  for select using (
    id in (select public.get_accessible_budget_ids())
  );

-- C. Categories
drop policy if exists "Members can view categories" on categories;
create policy "Members can view categories" on categories
  for select using (
    budget_id in (select public.get_accessible_budget_ids())
  );

-- D. Accounts
drop policy if exists "Members can view shared accounts" on accounts; -- Drop previous fix
drop policy if exists "Users can CRUD their own accounts" on accounts;
create policy "Users can view accessible accounts" on accounts
  for select using (
    id in (select public.get_accessible_account_ids())
  );
create policy "Users can update own accounts" on accounts
  for update using (user_id = auth.uid());
create policy "Users can insert own accounts" on accounts
  for insert with check (user_id = auth.uid());
create policy "Users can delete own accounts" on accounts
  for delete using (user_id = auth.uid());

-- E. Transactions
drop policy if exists "Members can view transactions" on transactions;
create policy "Members can view transactions" on transactions
  for select using (
    (budget_id is not null and budget_id in (select public.get_accessible_budget_ids()))
    or
    (account_id is not null and account_id in (select public.get_accessible_account_ids()))
  );

-- F. Fix Recurring Transactions too just in case
drop policy if exists "Members can view recurring" on recurring_transactions;
create policy "Members can view recurring" on recurring_transactions
  for select using (
    (budget_id is not null and budget_id in (select public.get_accessible_budget_ids()))
    or
    (account_id is not null and account_id in (select public.get_accessible_account_ids()))
  );
