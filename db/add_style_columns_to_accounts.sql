-- Add style columns to accounts table
-- Required for Goal creation which tries to save icon/color to the linked account

ALTER TABLE public.accounts 
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS icon text;

-- Optional: Set default values for existing rows if needed
-- UPDATE public.accounts SET color = 'blue', icon = 'wallet' WHERE color IS NULL;
