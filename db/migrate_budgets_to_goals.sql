-- Migrate 'ahorro' Budgets to Goals

-- 1. Insert into goals
INSERT INTO public.goals (
    name, 
    target_amount, 
    account_id, 
    user_id, 
    icon, 
    color, 
    created_at
)
SELECT 
    name, 
    monthly_limit as target_amount, 
    account_id, 
    owner_id as user_id, 
    'star' as icon, -- Default icon
    '#10B981' as color, -- Default Green
    created_at
FROM 
    public.budgets 
WHERE 
    type = 'ahorro' 
    AND account_id IS NOT NULL;

-- 2. Delete migrated budgets
DELETE FROM public.budgets 
WHERE type = 'ahorro';
