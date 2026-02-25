-- Add credit card specific columns
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS closing_day INTEGER,
ADD COLUMN IF NOT EXISTS due_day INTEGER;

-- Update Account Type Check Constraint
-- Drop the existing constraint
ALTER TABLE public.accounts 
DROP CONSTRAINT IF EXISTS accounts_type_check;

-- Add the new constraint including 'credit'
ALTER TABLE public.accounts 
ADD CONSTRAINT accounts_type_check 
CHECK (type IN ('bank', 'cash', 'crypto', 'wallet', 'other', 'ahorro', 'credit'));
