-- FIX: Account Creation RLS Policy

-- 1. Drop potentially conflicting or duplicate insert policies
DROP POLICY IF EXISTS "Users can insert own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can create accounts" ON accounts;
DROP POLICY IF EXISTS "Users can CRUD their own accounts" ON accounts;

-- 2. Create the explicit INSERT policy
CREATE POLICY "Users can create accounts" ON accounts
FOR INSERT WITH CHECK (
    -- Allow insert if the user_id of the new row matches the authenticated user
    auth.uid() = user_id
);

-- 3. Ensure Update/Delete also works for own accounts (just in case)
DROP POLICY IF EXISTS "Users can update own accounts" ON accounts;
CREATE POLICY "Users can update own accounts" ON accounts
FOR UPDATE USING (
    auth.uid() = user_id
);

DROP POLICY IF EXISTS "Users can delete own accounts" ON accounts;
CREATE POLICY "Users can delete own accounts" ON accounts
FOR DELETE USING (
    auth.uid() = user_id
);

-- 4. Ensure Select works (re-affirming own access)
-- Note: complex select policies for shared access might exist, so we only ensure basic own access if missing
-- Ideally, do not break shared access queries.
-- Let's just stick to fixing CRUD for now which seems to be the blocker.
