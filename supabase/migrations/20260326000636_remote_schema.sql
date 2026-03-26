alter table "public"."accounts" add column "credit_limit_usd" numeric(12,2) default NULL::numeric;

alter table "public"."accounts" add column "current_balance_usd" numeric default 0;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_balance_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Si es un ingreso, sumar al balance
  IF NEW.type = 'ingreso' THEN
    IF NEW.currency = 'USD' THEN
      UPDATE public.accounts SET current_balance_usd = COALESCE(current_balance_usd, 0) + NEW.amount
      WHERE id = NEW.account_id;
    ELSE
      UPDATE public.accounts SET current_balance = COALESCE(current_balance, 0) + NEW.amount
      WHERE id = NEW.account_id;
    END IF;
  END IF;

  -- Si es un egreso, restar al balance
  IF NEW.type = 'egreso' THEN
    IF NEW.currency = 'USD' THEN
      UPDATE public.accounts SET current_balance_usd = COALESCE(current_balance_usd, 0) - NEW.amount
      WHERE id = NEW.account_id;
    ELSE
      UPDATE public.accounts SET current_balance = COALESCE(current_balance, 0) - NEW.amount
      WHERE id = NEW.account_id;
    END IF;
  END IF;

  -- Para transferencias
  IF NEW.is_transfer = true AND NEW.transfer_target_id IS NOT NULL THEN
     IF NEW.type = 'egreso' THEN
       IF NEW.currency = 'USD' THEN
         UPDATE public.accounts SET current_balance_usd = COALESCE(current_balance_usd, 0) + NEW.amount WHERE id = NEW.transfer_target_id;
       ELSE
         UPDATE public.accounts SET current_balance = COALESCE(current_balance, 0) + NEW.amount WHERE id = NEW.transfer_target_id;
       END IF;
     END IF;
  END IF;

  RETURN NEW;
END;
$function$
;


