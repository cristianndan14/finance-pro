-- FIX: Persistent RLS Error on Account Creation
-- The previous error (42501) likely happens because the INSERT succeeds, 
-- but the RETURNING * clause fails because the new row isn't visible via the complex SELECT policy.

-- 1. Ensure we have a SIMPLE, direct SELECT policy for own accounts.
-- This combined with existing policies creates an OR condition.
-- user_id = auth.uid() is extremely fast and recursion-safe.

DROP POLICY IF EXISTS "Users can view own accounts" ON accounts;
CREATE POLICY "Users can view own accounts" ON accounts
FOR SELECT USING (
    auth.uid() = user_id
);

-- 2. Re-apply the simple INSERT policy (just to be absolutely sure)
DROP POLICY IF EXISTS "Users can create accounts" ON accounts;
CREATE POLICY "Users can create accounts" ON accounts
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

-- 3. Re-apply UPDATE/DELETE for own accounts
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

-- 4. Clean up any weird mixed policies from before if they exist
-- (This drops the policies created by the complex script IF they challenge the simple ones)
-- We keep 'Users can view accessible accounts' related to shared stuff, if it exists,
-- but having 'Users can view own accounts' makes the check pass immediately for the owner.
