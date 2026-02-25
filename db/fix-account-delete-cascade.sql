-- 1. Update TRANSACTIONS table
-- Remove old constraint
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_account_id_fkey;

-- Add new constraint with CASCADE
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_account_id_fkey
FOREIGN KEY (account_id)
REFERENCES public.accounts(id)
ON DELETE CASCADE;

-- Handle transfer_target_id (Set to NULL if account deletion happens, to preserve the sender's history)
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_transfer_target_id_fkey;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_transfer_target_id_fkey
FOREIGN KEY (transfer_target_id)
REFERENCES public.accounts(id)
ON DELETE SET NULL;


-- 2. Update RECURRING_TRANSACTIONS table
-- Remove old constraint
ALTER TABLE public.recurring_transactions
DROP CONSTRAINT IF EXISTS recurring_transactions_account_id_fkey;

-- Add new constraint with CASCADE
ALTER TABLE public.recurring_transactions
ADD CONSTRAINT recurring_transactions_account_id_fkey
FOREIGN KEY (account_id)
REFERENCES public.accounts(id)
ON DELETE CASCADE;
