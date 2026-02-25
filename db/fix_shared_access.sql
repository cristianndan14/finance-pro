-- Allow users to view Accounts if they are members of a linked Budget or Goal
-- This is necessary so they can see the "Balance" or "Progress"

create policy "Members can view linked accounts (Budgets)" on public.accounts
  for select using (
    exists (
      select 1 from public.budgets b
      join public.budget_members bm on b.id = bm.budget_id
      where b.account_id = accounts.id
      and bm.user_id = auth.uid()
    )
  );

create policy "Members can view linked accounts (Goals)" on public.accounts
  for select using (
    exists (
      select 1 from public.goals g
      join public.goal_members gm on g.id = gm.goal_id
      where g.account_id = accounts.id
      and gm.user_id = auth.uid()
    )
  );
