-- ==============================================================
-- FIX: ACCOUNTS RLS - Infinite Recursion / 400 Error
-- ==============================================================
-- The get_accessible_account_ids() function inside fix_rls_final.sql
-- does: SELECT id FROM accounts WHERE user_id = auth.uid()
-- This triggers the accounts RLS policy which calls the same function → infinite loop.
--
-- SOLUTION: Drop ALL accounts policies and replace with a single simple one.
-- We do NOT need complex shared-account policies for this app's current feature set.
-- ==============================================================

-- 1. Drop every existing policy on accounts (clean slate)
DROP POLICY IF EXISTS "Users can CRUD their own accounts"           ON public.accounts;
DROP POLICY IF EXISTS "Users can view own accounts"                 ON public.accounts;
DROP POLICY IF EXISTS "Users can view accessible accounts"          ON public.accounts;
DROP POLICY IF EXISTS "Members can view shared accounts"            ON public.accounts;
DROP POLICY IF EXISTS "Members can view linked accounts (Budgets)"  ON public.accounts;
DROP POLICY IF EXISTS "Members can view linked accounts (Goals)"    ON public.accounts;
DROP POLICY IF EXISTS "Users can update own accounts"               ON public.accounts;
DROP POLICY IF EXISTS "Users can insert own accounts"               ON public.accounts;
DROP POLICY IF EXISTS "Users can delete own accounts"               ON public.accounts;
DROP POLICY IF EXISTS "Users can create accounts"                   ON public.accounts;

-- 2. Create clean, recursion-safe policies
-- SELECT: simple direct check, no function calls, no subqueries on same table
CREATE POLICY "accounts_select" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "accounts_insert" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts_update" ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "accounts_delete" ON public.accounts
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Also fix transactions RLS which had the same recursion via get_accessible_account_ids()
DROP POLICY IF EXISTS "Members can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Editors can insert transactions" ON public.transactions;

CREATE POLICY "transactions_select" ON public.transactions
  FOR SELECT USING (
    -- Own transactions via account
    (account_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.accounts
      WHERE id = transactions.account_id AND user_id = auth.uid()
    ))
    OR
    -- Own transactions via budget ownership
    (budget_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.budgets
      WHERE id = transactions.budget_id AND owner_id = auth.uid()
    ))
    OR
    -- Shared budget transactions
    (budget_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.budget_members
      WHERE budget_id = transactions.budget_id AND user_id = auth.uid()
    ))
    OR
    -- Own transactions via user_id (if column exists)
    (user_id = auth.uid())
  );

CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT WITH CHECK (
    (account_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.accounts
      WHERE id = transactions.account_id AND user_id = auth.uid()
    ))
    OR
    (budget_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.budget_members
      WHERE budget_id = transactions.budget_id AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
    ))
    OR
    (user_id = auth.uid())
  );

-- 4. Fix goal_participants - create if it doesn't exist yet
-- (The frontend code references goal_participants but the DB only had goal_members)
-- We create it as an alias/replacement for goal_members with the expected schema.
CREATE TABLE IF NOT EXISTS public.goal_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id uuid REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (goal_id, user_id)
);

ALTER TABLE public.goal_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "goal_participants_select" ON public.goal_participants;
DROP POLICY IF EXISTS "goal_participants_insert" ON public.goal_participants;
DROP POLICY IF EXISTS "goal_participants_delete" ON public.goal_participants;

CREATE POLICY "goal_participants_select" ON public.goal_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR goal_id IN (SELECT id FROM public.goals WHERE user_id = auth.uid())
  );

CREATE POLICY "goal_participants_insert" ON public.goal_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "goal_participants_delete" ON public.goal_participants
  FOR DELETE USING (user_id = auth.uid());
