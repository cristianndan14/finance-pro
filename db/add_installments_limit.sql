-- Add installments limit specific column
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS installments_limit DECIMAL(12,2);
