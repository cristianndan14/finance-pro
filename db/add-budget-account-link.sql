-- Add account_id to budgets to allow "Savings Goal" tracking
ALTER TABLE public.budgets
ADD COLUMN account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;
