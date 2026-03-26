-- Add user_id column to recurring_transactions so rows can be filtered per user
ALTER TABLE recurring_transactions
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id);

-- Backfill user_id from the linked account (best-effort for existing rows)
UPDATE recurring_transactions rt
SET user_id = a.user_id
FROM accounts a
WHERE rt.account_id = a.id
  AND rt.user_id IS NULL;

-- Enable RLS policy using user_id
CREATE POLICY "Users can manage own recurring transactions"
ON recurring_transactions
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
