-- ============================================================
-- FIX: Transaction Visibility in Historial
-- The transactions table may have rows where user_id IS NULL
-- because they were created before the user_id column was added,
-- or because the backfill in add_user_to_transactions.sql didn't
-- cover all cases. This makes them invisible under RLS policies
-- that rely on user_id = auth.uid().
-- ============================================================

-- 1. Backfill user_id from account owner (most reliable source)
UPDATE public.transactions t
SET user_id = a.user_id
FROM public.accounts a
WHERE t.account_id = a.id
  AND t.user_id IS NULL;

-- 2. Backfill user_id from budget owner (for transactions without an account)
UPDATE public.transactions t
SET user_id = b.owner_id
FROM public.budgets b
WHERE t.budget_id = b.id
  AND t.user_id IS NULL;

-- 3. Also backfill via transfer_target_id (transfers where account_id may be the target)
UPDATE public.transactions t
SET user_id = a.user_id
FROM public.accounts a
WHERE t.transfer_target_id = a.id
  AND t.user_id IS NULL;

-- 4. Clean slate: drop ALL existing SELECT and general policies on transactions
--    (Multiple migrations created overlapping/conflicting policies)
DROP POLICY IF EXISTS "Members can view transactions"        ON public.transactions;
DROP POLICY IF EXISTS "Editors can insert transactions"      ON public.transactions;
DROP POLICY IF EXISTS "transactions_view_policy"             ON public.transactions;
DROP POLICY IF EXISTS "transactions_manage_policy"           ON public.transactions;
DROP POLICY IF EXISTS "transactions_select"                  ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert"                  ON public.transactions;
DROP POLICY IF EXISTS "Editors/Owners can manage transactions" ON public.transactions;

-- 5. Create a single, clean, comprehensive SELECT policy
--    Prioritizes user_id for speed; falls back to account/budget checks
CREATE POLICY "transactions_select" ON public.transactions
  FOR SELECT USING (
    -- Primary: direct user ownership (fastest, works for all new transactions)
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR
    -- Fallback: transaction belongs to an account owned by the user
    (account_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.accounts
      WHERE id = transactions.account_id AND user_id = auth.uid()
    ))
    OR
    -- Fallback: transaction belongs to a budget owned by/shared with the user
    (budget_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.budgets
      WHERE id = transactions.budget_id AND (
        owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.budget_members
          WHERE budget_id = budgets.id AND user_id = auth.uid()
        )
      )
    ))
  );

-- 6. Create a clean INSERT policy
CREATE POLICY "transactions_insert" ON public.transactions
  FOR INSERT WITH CHECK (
    (user_id = auth.uid())
    OR
    (account_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.accounts
      WHERE id = transactions.account_id AND user_id = auth.uid()
    ))
    OR
    (budget_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.budget_members
      WHERE budget_id = transactions.budget_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'editor')
    ))
  );

-- 7. Create UPDATE/DELETE policies for own transactions
CREATE POLICY "transactions_update" ON public.transactions
  FOR UPDATE USING (
    user_id = auth.uid()
    OR
    (account_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.accounts
      WHERE id = transactions.account_id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "transactions_delete" ON public.transactions
  FOR DELETE USING (
    user_id = auth.uid()
    OR
    (account_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.accounts
      WHERE id = transactions.account_id AND user_id = auth.uid()
    ))
  );
