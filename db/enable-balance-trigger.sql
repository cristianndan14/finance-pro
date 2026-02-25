-- Enable automatic account balance updates on transactions
-- Run this in your Supabase SQL Editor

-- Create or replace the trigger function (already exists but ensuring it's correct)
CREATE OR REPLACE FUNCTION public.handle_balance_update()
RETURNS trigger AS $$
BEGIN
  -- Update account balance based on transaction type
  IF NEW.type = 'ingreso' THEN
    UPDATE public.accounts 
    SET current_balance = current_balance + NEW.amount
    WHERE id = NEW.account_id;
  END IF;

  IF NEW.type = 'egreso' THEN
    UPDATE public.accounts 
    SET current_balance = current_balance - NEW.amount
    WHERE id = NEW.account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_transaction_created ON public.transactions;

-- Create the trigger
CREATE TRIGGER on_transaction_created
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_balance_update();
