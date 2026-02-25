-- MASTER FIX FOR RLS POLICIES (Run this entire script)
-- Fixes visibility for Owners and Members across all tables
-- Fixes recursion issues

-- ============================================
-- 1. DROP ALL EXISTING POLICIES
-- ============================================

-- Budget Members
DROP POLICY IF EXISTS "Members can view other members" ON budget_members;
DROP POLICY IF EXISTS "Allow insert for budget creation" ON budget_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON budget_members;
DROP POLICY IF EXISTS "Owners can manage members" ON budget_members;
DROP POLICY IF EXISTS "budget_members_insert_policy" ON budget_members;
DROP POLICY IF EXISTS "budget_members_select_policy" ON budget_members;
DROP POLICY IF EXISTS "budget_members_delete_policy" ON budget_members;

-- Budgets
DROP POLICY IF EXISTS "Users can view budgets they belong to" ON budgets;
DROP POLICY IF EXISTS "Owners can update budgets" ON budgets;
DROP POLICY IF EXISTS "Owners can delete budgets" ON budgets;
DROP POLICY IF EXISTS "Users can create budgets" ON budgets;
DROP POLICY IF EXISTS "budgets_select_policy" ON budgets;
DROP POLICY IF EXISTS "budgets_insert_policy" ON budgets;
DROP POLICY IF EXISTS "budgets_update_policy" ON budgets;
DROP POLICY IF EXISTS "budgets_delete_policy" ON budgets;

-- Categories
DROP POLICY IF EXISTS "Members can view categories" ON categories;
DROP POLICY IF EXISTS "Editors/Owners can manage categories" ON categories;
DROP POLICY IF EXISTS "categories_view_policy" ON categories;
DROP POLICY IF EXISTS "categories_manage_policy" ON categories;

-- Transactions
DROP POLICY IF EXISTS "Members can view transactions" ON transactions;
DROP POLICY IF EXISTS "Editors/Owners can manage transactions" ON transactions;
DROP POLICY IF EXISTS "transactions_view_policy" ON transactions;
DROP POLICY IF EXISTS "transactions_manage_policy" ON transactions;

-- ============================================
-- 2. HELPER FUNCTIONS
-- ============================================

-- Check if user is owner of the budget
CREATE OR REPLACE FUNCTION is_budget_owner(budget_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM budgets
    WHERE id = budget_uuid AND owner_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is a member of the budget
CREATE OR REPLACE FUNCTION is_budget_member(budget_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM budget_members
    WHERE budget_id = budget_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has edit permission (Owner or Editor role)
CREATE OR REPLACE FUNCTION has_budget_edit_permission(budget_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- Check if owner first
  IF EXISTS (SELECT 1 FROM budgets WHERE id = budget_uuid AND owner_id = user_uuid) THEN
    RETURN true;
  END IF;

  -- Check membership role
  SELECT role INTO user_role FROM budget_members WHERE budget_id = budget_uuid AND user_id = user_uuid;
  
  RETURN user_role IN ('owner', 'editor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- 3. APPLY NEW POLICIES
-- ============================================

-- --- BUDGETS ---
CREATE POLICY "budgets_select_policy" ON budgets
  FOR SELECT USING (owner_id = auth.uid() OR is_budget_member(id, auth.uid()));

CREATE POLICY "budgets_insert_policy" ON budgets
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "budgets_update_policy" ON budgets
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "budgets_delete_policy" ON budgets
  FOR DELETE USING (owner_id = auth.uid());

-- --- BUDGET MEMBERS ---
CREATE POLICY "budget_members_select_policy" ON budget_members
  FOR SELECT USING (user_id = auth.uid() OR is_budget_owner(budget_id, auth.uid()));

CREATE POLICY "budget_members_insert_policy" ON budget_members
  FOR INSERT WITH CHECK (true); -- Logic handled by app/trigger usually, or allow invite

CREATE POLICY "budget_members_delete_policy" ON budget_members
  FOR DELETE USING (user_id = auth.uid() OR is_budget_owner(budget_id, auth.uid()));

-- --- CATEGORIES ---
CREATE POLICY "categories_view_policy" ON categories
  FOR SELECT USING (
    is_budget_owner(budget_id, auth.uid()) OR is_budget_member(budget_id, auth.uid())
  );

CREATE POLICY "categories_manage_policy" ON categories
  FOR ALL USING (
    has_budget_edit_permission(budget_id, auth.uid())
  );

-- --- TRANSACTIONS ---
CREATE POLICY "transactions_view_policy" ON transactions
  FOR SELECT USING (
    -- Access if own account OR access to budget
    (account_id IS NOT NULL AND EXISTS (SELECT 1 FROM accounts WHERE id = transactions.account_id AND user_id = auth.uid()))
    OR
    (budget_id IS NOT NULL AND (is_budget_owner(budget_id, auth.uid()) OR is_budget_member(budget_id, auth.uid())))
  );

CREATE POLICY "transactions_manage_policy" ON transactions
  FOR ALL USING (
     -- Allow if own account
    (account_id IS NOT NULL AND EXISTS (SELECT 1 FROM accounts WHERE id = transactions.account_id AND user_id = auth.uid()))
    OR
    -- Allow if budget editor
    (budget_id IS NOT NULL AND has_budget_edit_permission(budget_id, auth.uid()))
  );
