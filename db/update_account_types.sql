-- Update Account Type Check Constraint
-- Allow 'ahorro' type for Goal-linked accounts

ALTER TABLE public.accounts 
DROP CONSTRAINT IF EXISTS accounts_type_check;

ALTER TABLE public.accounts 
ADD CONSTRAINT accounts_type_check 
CHECK (type IN ('bank', 'cash', 'crypto', 'wallet', 'other', 'ahorro'));
