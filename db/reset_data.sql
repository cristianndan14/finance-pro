-- 1. Delete all transactions (Dependent on accounts and budgets)
DELETE FROM public.transactions;

-- 2. Delete all accounts (Goals/Budgets depend on this, but we handled FKs)
-- Note: Budgets.account_id is SET NULL, so budgets won't be deleted, just unlinked.
DELETE FROM public.accounts;

-- 3. Delete 'Ahorro' Budgets (Since we are migrating to Goals and they are now invalid without accounts)
DELETE FROM public.budgets WHERE type = 'ahorro';
