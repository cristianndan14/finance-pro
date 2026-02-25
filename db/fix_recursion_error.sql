-- FIX: Infinite Recursion in RLS policies
-- We replace the direct table joins in the Policy with a "Security Definer" function.
-- This function runs with admin privileges, bypassing the RLS check on the referenced tables (Goals/Budgets), 
-- breaking the infinite loop.

-- 1. Drop the problematic policies causing recursion
drop policy if exists "Members can view linked accounts (Budgets)" on public.accounts;
drop policy if exists "Members can view linked accounts (Goals)" on public.accounts;

-- 2. Create a secure function to check access without recursion
create or replace function public.check_shared_account_access(account_id uuid)
returns boolean
language plpgsql
security definer -- <== This is the key. Runs as Owner/Admin.
set search_path = public -- Good practice for security definers
as $$
begin
  -- Check if user is a member of any Budget linked to this account
  if exists (
    select 1 from budgets b
    join budget_members bm on b.id = bm.budget_id
    where b.account_id = check_shared_account_access.account_id
    and bm.user_id = auth.uid()
  ) then
    return true;
  end if;

  -- Check if user is a member of any Goal linked to this account
  if exists (
    select 1 from goals g
    join goal_members gm on g.id = gm.goal_id
    where g.account_id = check_shared_account_access.account_id
    and gm.user_id = auth.uid()
  ) then
    return true;
  end if;

  return false;
end;
$$;

-- 3. Re-create the policy on Accounts using the secure function
create policy "Members can view shared accounts" on public.accounts
  for select using (
    check_shared_account_access(id)
  );
