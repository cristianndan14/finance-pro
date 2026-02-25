-- Add is_automatic column to recurring_transactions
ALTER TABLE public.recurring_transactions 
ADD COLUMN is_automatic boolean DEFAULT true;

-- Update existing records to be automatic (safest default for existing)
UPDATE public.recurring_transactions 
SET is_automatic = true 
WHERE is_automatic IS NULL;
