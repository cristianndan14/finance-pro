-- 1. Drop existing limited policy
drop policy if exists "Members can view recurring" on public.recurring_transactions;

-- 2. Create comprehensive policies
-- A. SELECT: Members of budget OR Owner of Account
create policy "Members can view recurring" on public.recurring_transactions
  for select using (
    (budget_id is not null and exists (
      select 1 from budget_members where budget_id = recurring_transactions.budget_id and user_id = auth.uid()
    )) or 
    (account_id is not null and exists (
      select 1 from accounts where id = recurring_transactions.account_id and user_id = auth.uid()
    ))
  );

-- B. INSERT: Editors of budget OR Owner of Account
create policy "Editors can insert recurring" on public.recurring_transactions
  for insert with check (
    -- Permiso por Budget (Owner/Editor)
    (budget_id is not null and exists (
      select 1 from budget_members 
      where budget_id = recurring_transactions.budget_id 
      and user_id = auth.uid() 
      and role in ('owner', 'editor')
    ))
    OR
    -- Permiso por Cuenta (Owner)
    (account_id is not null and exists (
      select 1 from accounts 
      where id = recurring_transactions.account_id 
      and user_id = auth.uid()
    ))
    OR
    -- Allow if NO budget and NO account (orphan rule? unlikely but flexible)
    -- Actually, for recurring we usually require at least an account or budget. 
    -- But let's stick to the pattern: if you own the resource referenced, you can create.
    -- If created without budget (budget_id is null), check account ownership.
    (budget_id is null and account_id is not null and exists (
      select 1 from accounts where id = recurring_transactions.account_id and user_id = auth.uid()
    ))
  );

-- C. UPDATE: Editors of budget OR Owner of Account
create policy "Editors can update recurring" on public.recurring_transactions
  for update using (
    (budget_id is not null and exists (
      select 1 from budget_members 
      where budget_id = recurring_transactions.budget_id 
      and user_id = auth.uid() 
      and role in ('owner', 'editor')
    ))
    OR
    (account_id is not null and exists (
      select 1 from accounts 
      where id = recurring_transactions.account_id 
      and user_id = auth.uid()
    ))
  );

-- D. DELETE: Editors of budget OR Owner of Account
create policy "Editors can delete recurring" on public.recurring_transactions
  for delete using (
    (budget_id is not null and exists (
      select 1 from budget_members 
      where budget_id = recurring_transactions.budget_id 
      and user_id = auth.uid() 
      and role in ('owner', 'editor')
    ))
    OR
    (account_id is not null and exists (
      select 1 from accounts 
      where id = recurring_transactions.account_id 
      and user_id = auth.uid()
    ))
  );
