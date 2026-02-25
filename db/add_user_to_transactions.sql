-- Add user_id to transactions to track who created it
alter table public.transactions 
add column if not exists user_id uuid references public.profiles(id);

-- Backfill existing transactions (Best Effort)
-- 1. If linked to account, assume account owner
update public.transactions t
set user_id = a.user_id
from public.accounts a
where t.account_id = a.id
and t.user_id is null;

-- 2. If valid budget, assume budget owner (fallback)
update public.transactions t
set user_id = b.owner_id
from public.budgets b
where t.budget_id = b.id
and t.user_id is null;

-- 3. Set default for new rows (optional, but good for consistency)
alter table public.transactions 
alter column user_id set default auth.uid();

-- 4. Update Policies to allow inserting user_id (if not already covered)
-- Existing policies check "with check", which validates the row. 
-- We should ensure users can only insert THEIR own user_id.

drop policy if exists "Editors can insert transactions" on transactions;
create policy "Editors can insert transactions" on transactions
  for insert with check (
    -- User ID must match auth.uid()
    (user_id = auth.uid() or user_id is null) 
    AND (
      -- Permission by Budget (Owner/Editor)
      (budget_id is not null and exists (
        select 1 from budget_members 
        where budget_id = transactions.budget_id 
        and user_id = auth.uid() 
        and role in ('owner', 'editor')
      ))
      OR
      -- Permission by Account (Owner)
      (account_id is not null and exists (
        select 1 from accounts 
        where id = transactions.account_id 
        and user_id = auth.uid()
      ))
    )
  );

-- 5. Allow updating user_id? Probably not.
-- But we need select policy to see it. 
-- "Members can view transactions" already exists and allows viewing entire row.
