-- Add columns for installment tracking
ALTER TABLE transactions 
ADD COLUMN installments_count INTEGER DEFAULT 1,
ADD COLUMN installment_number INTEGER DEFAULT 1,
ADD COLUMN original_transaction_id UUID REFERENCES transactions(id);

-- Commentary:
-- installments_count: Total number of installments (e.g., 12)
-- installment_number: Which installment this is (e.g., 1 of 12)
-- original_transaction_id: Links all installments of the same purchase together. 
-- For the first installment, this could be null or point to itself, or we can use a separate UUID for the "purchase group".
-- Let's stick to: original_transaction_id is NULL for the first one? Or maybe easier:
-- improved approach: group_id UUID.
-- But the plan said `original_transaction_id`. Let's stick to that.
-- If I am creating 12 records, they all share the same `original_transaction_id`? 
-- Or maybe the first one is the "parent"?
-- Simpler: Add `group_id` UUID?
-- Let's use `original_transaction_id` as the ID of the *first* transaction in the series.
-- So for the first one, it is NULL (or equal to its own ID if we know it, but we might not know it before insert).
-- Actually, if we insert 12 records, we can generate a random UUID for a `group_id` column to easily link them.
-- Let's add `installment_group_id` instead of `original_transaction_id` for clarity.

ALTER TABLE transactions 
DROP COLUMN original_transaction_id;

ALTER TABLE transactions
ADD COLUMN installment_group_id UUID;
