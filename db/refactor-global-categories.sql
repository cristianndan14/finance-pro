-- 1. Add user_id to categories
ALTER TABLE public.categories 
ADD COLUMN user_id uuid references public.profiles(id);

-- 2. Populate user_id based on existing budget ownership
-- (Linking category to the owner of the budget it currently belongs to)
UPDATE public.categories
SET user_id = budgets.owner_id
FROM public.budgets
WHERE categories.budget_id = budgets.id;

-- 3. Make user_id NOT NULL after population (ensures every category has an owner)
ALTER TABLE public.categories 
ALTER COLUMN user_id SET NOT NULL;

-- 4. Make budget_id NULLABLE (detach from strict budget requirement)
ALTER TABLE public.categories 
ALTER COLUMN budget_id DROP NOT NULL;

-- 5. Update RLS Policies for Categories
-- Drop old policies linked to budget members
DROP POLICY IF EXISTS "Members can view categories" ON public.categories;
DROP POLICY IF EXISTS "Editors/Owners can manage categories" ON public.categories;

-- Create new User-Centric policies
CREATE POLICY "Users can CRUD their own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- (Optional) If we want shared budget members to see the owner's categories used in that budget?
-- For simplicity Phase 8: Categories are private to the user. 
-- In a shared budget, User A sees User A's categories. User B sees User B's categories.
-- If they want to share "definitions" it's complex. Let's stick to Personal Categories for now.
