ALTER TABLE recurring_transactions
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'ARS';
