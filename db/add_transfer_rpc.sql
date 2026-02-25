-- RPC for Atomic Transfers
CREATE OR REPLACE FUNCTION public.perform_transfer(
  p_source_account_id uuid,
  p_target_account_id uuid,
  p_amount numeric,
  p_description text,
  p_date timestamp with time zone,
  p_budget_id uuid DEFAULT NULL
)
RETURNS uuid -- Returns the new transaction ID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id uuid;
BEGIN
  -- 1. Deduct from Source Account
  UPDATE public.accounts
  SET current_balance = current_balance - p_amount
  WHERE id = p_source_account_id;

  -- 2. Add to Target Account
  UPDATE public.accounts
  SET current_balance = current_balance + p_amount
  WHERE id = p_target_account_id;

  -- 3. Record the Transaction
  -- We store it primarily on the source account side as an 'egreso' (money leaving),
  -- but mark it as a transfer so UI can treat it differently.
  INSERT INTO public.transactions (
    account_id,
    transfer_target_id,
    budget_id,
    amount,
    type,
    description,
    is_transfer,
    created_at
  ) VALUES (
    p_source_account_id,
    p_target_account_id,
    p_budget_id,
    p_amount,
    'egreso', -- It leaves the primary account
    p_description,
    true,
    p_date
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$$;
