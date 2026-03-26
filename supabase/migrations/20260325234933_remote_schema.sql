drop extension if exists "pg_net";


  create table "public"."accounts" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "type" text not null,
    "current_balance" numeric default 0,
    "currency" text default 'ARS'::text,
    "created_at" timestamp with time zone default now(),
    "color" text,
    "icon" text,
    "credit_limit" numeric(12,2),
    "closing_day" integer,
    "due_day" integer,
    "installments_limit" numeric(12,2),
    "entity_id" uuid
      );


alter table "public"."accounts" enable row level security;


  create table "public"."budget_members" (
    "budget_id" uuid not null,
    "user_id" uuid not null,
    "role" text not null,
    "joined_at" timestamp with time zone default now()
      );


alter table "public"."budget_members" enable row level security;


  create table "public"."budgets" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid not null,
    "name" text not null,
    "type" text not null,
    "monthly_limit" numeric,
    "base_currency" text default 'ARS'::text,
    "invite_token" uuid default gen_random_uuid(),
    "created_at" timestamp with time zone default now(),
    "account_id" uuid
      );


alter table "public"."budgets" enable row level security;


  create table "public"."categories" (
    "id" uuid not null default gen_random_uuid(),
    "budget_id" uuid,
    "name" text not null,
    "icon" text not null,
    "color" text not null,
    "created_at" timestamp with time zone default now(),
    "user_id" uuid
      );


alter table "public"."categories" enable row level security;


  create table "public"."entities" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."entities" enable row level security;


  create table "public"."friendships" (
    "id" uuid not null default gen_random_uuid(),
    "requester_id" uuid not null,
    "addressee_id" uuid not null,
    "status" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."friendships" enable row level security;


  create table "public"."goal_members" (
    "goal_id" uuid not null,
    "user_id" uuid not null,
    "role" text not null,
    "joined_at" timestamp with time zone default now()
      );


alter table "public"."goal_members" enable row level security;


  create table "public"."goal_participants" (
    "id" uuid not null default gen_random_uuid(),
    "goal_id" uuid not null,
    "user_id" uuid not null,
    "account_id" uuid not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."goal_participants" enable row level security;


  create table "public"."goals" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" text not null,
    "target_amount" numeric(20,2),
    "deadline" date,
    "icon" text,
    "color" text,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "account_id" uuid
      );


alter table "public"."goals" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "full_name" text,
    "updated_at" timestamp with time zone
      );


alter table "public"."profiles" enable row level security;


  create table "public"."recurring_transactions" (
    "id" uuid not null default gen_random_uuid(),
    "budget_id" uuid,
    "category_id" uuid,
    "account_id" uuid,
    "amount" numeric not null,
    "type" text not null,
    "frequency" text not null,
    "next_execution_date" date not null,
    "status" text default 'active'::text,
    "description" text,
    "created_at" timestamp with time zone default now(),
    "is_automatic" boolean default true
      );


alter table "public"."recurring_transactions" enable row level security;


  create table "public"."transactions" (
    "id" uuid not null default gen_random_uuid(),
    "budget_id" uuid,
    "category_id" uuid,
    "account_id" uuid,
    "transfer_target_id" uuid,
    "recurring_id" uuid,
    "type" text not null,
    "amount" numeric not null,
    "currency" text default 'ARS'::text,
    "description" text,
    "is_transfer" boolean default false,
    "created_at" timestamp with time zone default now(),
    "user_id" uuid default auth.uid(),
    "installments_count" integer default 1,
    "installment_number" integer default 1,
    "installment_group_id" uuid
      );


alter table "public"."transactions" enable row level security;

CREATE UNIQUE INDEX accounts_pkey ON public.accounts USING btree (id);

CREATE UNIQUE INDEX budget_members_pkey ON public.budget_members USING btree (budget_id, user_id);

CREATE UNIQUE INDEX budgets_pkey ON public.budgets USING btree (id);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX entities_pkey ON public.entities USING btree (id);

CREATE UNIQUE INDEX friendships_pkey ON public.friendships USING btree (id);

CREATE UNIQUE INDEX friendships_requester_id_addressee_id_key ON public.friendships USING btree (requester_id, addressee_id);

CREATE UNIQUE INDEX goal_members_pkey ON public.goal_members USING btree (goal_id, user_id);

CREATE UNIQUE INDEX goal_participants_goal_id_user_id_key ON public.goal_participants USING btree (goal_id, user_id);

CREATE UNIQUE INDEX goal_participants_pkey ON public.goal_participants USING btree (id);

CREATE UNIQUE INDEX goals_pkey ON public.goals USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX recurring_transactions_pkey ON public.recurring_transactions USING btree (id);

CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id);

alter table "public"."accounts" add constraint "accounts_pkey" PRIMARY KEY using index "accounts_pkey";

alter table "public"."budget_members" add constraint "budget_members_pkey" PRIMARY KEY using index "budget_members_pkey";

alter table "public"."budgets" add constraint "budgets_pkey" PRIMARY KEY using index "budgets_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."entities" add constraint "entities_pkey" PRIMARY KEY using index "entities_pkey";

alter table "public"."friendships" add constraint "friendships_pkey" PRIMARY KEY using index "friendships_pkey";

alter table "public"."goal_members" add constraint "goal_members_pkey" PRIMARY KEY using index "goal_members_pkey";

alter table "public"."goal_participants" add constraint "goal_participants_pkey" PRIMARY KEY using index "goal_participants_pkey";

alter table "public"."goals" add constraint "goals_pkey" PRIMARY KEY using index "goals_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."recurring_transactions" add constraint "recurring_transactions_pkey" PRIMARY KEY using index "recurring_transactions_pkey";

alter table "public"."transactions" add constraint "transactions_pkey" PRIMARY KEY using index "transactions_pkey";

alter table "public"."accounts" add constraint "accounts_entity_id_fkey" FOREIGN KEY (entity_id) REFERENCES public.entities(id) ON DELETE SET NULL not valid;

alter table "public"."accounts" validate constraint "accounts_entity_id_fkey";

alter table "public"."accounts" add constraint "accounts_type_check" CHECK ((type = ANY (ARRAY['bank'::text, 'cash'::text, 'crypto'::text, 'wallet'::text, 'other'::text, 'ahorro'::text, 'credit'::text]))) not valid;

alter table "public"."accounts" validate constraint "accounts_type_check";

alter table "public"."accounts" add constraint "accounts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "public"."accounts" validate constraint "accounts_user_id_fkey";

alter table "public"."budget_members" add constraint "budget_members_budget_id_fkey" FOREIGN KEY (budget_id) REFERENCES public.budgets(id) ON DELETE CASCADE not valid;

alter table "public"."budget_members" validate constraint "budget_members_budget_id_fkey";

alter table "public"."budget_members" add constraint "budget_members_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'editor'::text, 'viewer'::text]))) not valid;

alter table "public"."budget_members" validate constraint "budget_members_role_check";

alter table "public"."budget_members" add constraint "budget_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."budget_members" validate constraint "budget_members_user_id_fkey";

alter table "public"."budgets" add constraint "budgets_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL not valid;

alter table "public"."budgets" validate constraint "budgets_account_id_fkey";

alter table "public"."budgets" add constraint "budgets_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) not valid;

alter table "public"."budgets" validate constraint "budgets_owner_id_fkey";

alter table "public"."budgets" add constraint "budgets_type_check" CHECK ((type = ANY (ARRAY['gasto'::text, 'ahorro'::text]))) not valid;

alter table "public"."budgets" validate constraint "budgets_type_check";

alter table "public"."categories" add constraint "categories_budget_id_fkey" FOREIGN KEY (budget_id) REFERENCES public.budgets(id) ON DELETE CASCADE not valid;

alter table "public"."categories" validate constraint "categories_budget_id_fkey";

alter table "public"."categories" add constraint "categories_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "public"."categories" validate constraint "categories_user_id_fkey";

alter table "public"."entities" add constraint "entities_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "public"."entities" validate constraint "entities_user_id_fkey";

alter table "public"."friendships" add constraint "friendships_addressee_id_fkey" FOREIGN KEY (addressee_id) REFERENCES public.profiles(id) not valid;

alter table "public"."friendships" validate constraint "friendships_addressee_id_fkey";

alter table "public"."friendships" add constraint "friendships_requester_id_addressee_id_key" UNIQUE using index "friendships_requester_id_addressee_id_key";

alter table "public"."friendships" add constraint "friendships_requester_id_fkey" FOREIGN KEY (requester_id) REFERENCES public.profiles(id) not valid;

alter table "public"."friendships" validate constraint "friendships_requester_id_fkey";

alter table "public"."friendships" add constraint "friendships_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text]))) not valid;

alter table "public"."friendships" validate constraint "friendships_status_check";

alter table "public"."goal_members" add constraint "goal_members_goal_id_fkey" FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE not valid;

alter table "public"."goal_members" validate constraint "goal_members_goal_id_fkey";

alter table "public"."goal_members" add constraint "goal_members_role_check" CHECK ((role = ANY (ARRAY['owner'::text, 'editor'::text, 'viewer'::text]))) not valid;

alter table "public"."goal_members" validate constraint "goal_members_role_check";

alter table "public"."goal_members" add constraint "goal_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."goal_members" validate constraint "goal_members_user_id_fkey";

alter table "public"."goal_participants" add constraint "goal_participants_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE not valid;

alter table "public"."goal_participants" validate constraint "goal_participants_account_id_fkey";

alter table "public"."goal_participants" add constraint "goal_participants_goal_id_fkey" FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE not valid;

alter table "public"."goal_participants" validate constraint "goal_participants_goal_id_fkey";

alter table "public"."goal_participants" add constraint "goal_participants_goal_id_user_id_key" UNIQUE using index "goal_participants_goal_id_user_id_key";

alter table "public"."goal_participants" add constraint "goal_participants_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."goal_participants" validate constraint "goal_participants_user_id_fkey";

alter table "public"."goals" add constraint "goals_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL not valid;

alter table "public"."goals" validate constraint "goals_account_id_fkey";

alter table "public"."goals" add constraint "goals_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."goals" validate constraint "goals_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "username_length" CHECK ((char_length(full_name) >= 3)) not valid;

alter table "public"."profiles" validate constraint "username_length";

alter table "public"."recurring_transactions" add constraint "recurring_transactions_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE not valid;

alter table "public"."recurring_transactions" validate constraint "recurring_transactions_account_id_fkey";

alter table "public"."recurring_transactions" add constraint "recurring_transactions_budget_id_fkey" FOREIGN KEY (budget_id) REFERENCES public.budgets(id) ON DELETE CASCADE not valid;

alter table "public"."recurring_transactions" validate constraint "recurring_transactions_budget_id_fkey";

alter table "public"."recurring_transactions" add constraint "recurring_transactions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) not valid;

alter table "public"."recurring_transactions" validate constraint "recurring_transactions_category_id_fkey";

alter table "public"."recurring_transactions" add constraint "recurring_transactions_frequency_check" CHECK ((frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text, 'yearly'::text]))) not valid;

alter table "public"."recurring_transactions" validate constraint "recurring_transactions_frequency_check";

alter table "public"."recurring_transactions" add constraint "recurring_transactions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text]))) not valid;

alter table "public"."recurring_transactions" validate constraint "recurring_transactions_status_check";

alter table "public"."recurring_transactions" add constraint "recurring_transactions_type_check" CHECK ((type = ANY (ARRAY['ingreso'::text, 'egreso'::text]))) not valid;

alter table "public"."recurring_transactions" validate constraint "recurring_transactions_type_check";

alter table "public"."transactions" add constraint "transactions_account_id_fkey" FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE not valid;

alter table "public"."transactions" validate constraint "transactions_account_id_fkey";

alter table "public"."transactions" add constraint "transactions_budget_id_fkey" FOREIGN KEY (budget_id) REFERENCES public.budgets(id) ON DELETE CASCADE not valid;

alter table "public"."transactions" validate constraint "transactions_budget_id_fkey";

alter table "public"."transactions" add constraint "transactions_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) not valid;

alter table "public"."transactions" validate constraint "transactions_category_id_fkey";

alter table "public"."transactions" add constraint "transactions_recurring_id_fkey" FOREIGN KEY (recurring_id) REFERENCES public.recurring_transactions(id) not valid;

alter table "public"."transactions" validate constraint "transactions_recurring_id_fkey";

alter table "public"."transactions" add constraint "transactions_transfer_target_id_fkey" FOREIGN KEY (transfer_target_id) REFERENCES public.accounts(id) ON DELETE SET NULL not valid;

alter table "public"."transactions" validate constraint "transactions_transfer_target_id_fkey";

alter table "public"."transactions" add constraint "transactions_type_check" CHECK ((type = ANY (ARRAY['ingreso'::text, 'egreso'::text]))) not valid;

alter table "public"."transactions" validate constraint "transactions_type_check";

alter table "public"."transactions" add constraint "transactions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) not valid;

alter table "public"."transactions" validate constraint "transactions_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_member_by_email(resource_type text, resource_id uuid, target_email text, target_role text DEFAULT 'viewer'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  target_user_id uuid;
  is_owner boolean;
begin
  -- 1. Find user
  select id into target_user_id from public.profiles where email = target_email;
  if target_user_id is null then
    return json_build_object('success', false, 'message', 'Usuario no encontrado');
  end if;

  -- 2. Check permissions (Must be owner of the resource)
  if resource_type = 'budget' then
    select (owner_id = auth.uid()) into is_owner from public.budgets where id = resource_id;
    if not is_owner then return json_build_object('success', false, 'message', 'No tienes permiso'); end if;
    
    insert into public.budget_members (budget_id, user_id, role)
    values (resource_id, target_user_id, target_role)
    on conflict (budget_id, user_id) do update set role = target_role;

  elsif resource_type = 'goal' then
    select (user_id = auth.uid()) into is_owner from public.goals where id = resource_id;
    if not is_owner then return json_build_object('success', false, 'message', 'No tienes permiso'); end if;

    insert into public.goal_members (goal_id, user_id, role)
    values (resource_id, target_user_id, target_role)
    on conflict (goal_id, user_id) do update set role = target_role;
  
  else
    return json_build_object('success', false, 'message', 'Tipo de recurso inválido');
  end if;

  return json_build_object('success', true, 'message', 'Miembro agregado exitosamente');
end;
$function$
;

CREATE OR REPLACE FUNCTION public.check_shared_account_access(account_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  -- Check if user is a member of any Budget linked to this account
  if exists (
    select 1 from budgets b
    join budget_members bm on b.id = bm.budget_id
    where b.account_id = check_shared_account_access.account_id
    and bm.user_id = auth.uid()
  ) then
    return true;
  end if;

  -- Check if user is a member of any Goal linked to this account
  if exists (
    select 1 from goals g
    join goal_members gm on g.id = gm.goal_id
    where g.account_id = check_shared_account_access.account_id
    and gm.user_id = auth.uid()
  ) then
    return true;
  end if;

  return false;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_accessible_account_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Own accounts
  select id from accounts where user_id = auth.uid()
  union
  -- Linked to accessible budgets
  select account_id from budgets 
  where id in (select budget_id from budget_members where user_id = auth.uid())
  and account_id is not null
  union
  -- Linked to accessible goals
  select account_id from goals
  where id in (select goal_id from goal_members where user_id = auth.uid())
  and account_id is not null;
$function$
;

CREATE OR REPLACE FUNCTION public.get_accessible_budget_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select budget_id from budget_members where user_id = auth.uid()
  union
  select id from budgets where owner_id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.handle_balance_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Update account balance based on transaction type (Source Account)
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

  -- Update target account balance if it's a transfer
  IF NEW.is_transfer = true AND NEW.transfer_target_id IS NOT NULL THEN
    IF NEW.type = 'egreso' THEN
      UPDATE public.accounts 
      SET current_balance = current_balance + NEW.amount
      WHERE id = NEW.transfer_target_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_budget()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- 1. Add Creator as Owner in members table
  INSERT INTO public.budget_members (budget_id, user_id, role)
  VALUES (new.id, new.owner_id, 'owner');

  -- NO Categories created here anymore.

  RETURN new;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'))
  on conflict (id) do nothing;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.has_budget_edit_permission(budget_uuid uuid, user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.is_budget_member(budget_uuid uuid, user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM budget_members
    WHERE budget_id = budget_uuid AND user_id = user_uuid
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_budget_owner(budget_uuid uuid, user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM budgets
    WHERE id = budget_uuid AND owner_id = user_uuid
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.perform_transfer(p_source_account_id uuid, p_target_account_id uuid, p_amount numeric, p_description text, p_date timestamp with time zone, p_budget_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_transaction_id uuid;
BEGIN
  -- We remove the manual UPDATE statements on the accounts here.
  -- The on_transaction_created trigger calling handle_balance_update() 
  -- will automatically deduct from p_source_account_id and add to p_target_account_id
  -- when the transaction is inserted below.

  -- Record the Transaction (It stores it as an egreso for the source)
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
    'egreso',
    p_description,
    true,
    p_date
  )
  RETURNING id INTO v_transaction_id;

  RETURN v_transaction_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.send_friend_request(target_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  target_user_id uuid;
  existing_request uuid;
begin
  -- 1. Find user by email
  select id into target_user_id from public.profiles where email = target_email;

  if target_user_id is null then
    return json_build_object('success', false, 'message', 'Usuario no encontrado');
  end if;

  if target_user_id = auth.uid() then
    return json_build_object('success', false, 'message', 'No puedes enviarte solicitud a ti mismo');
  end if;

  -- 2. Check if request already exists
  select id into existing_request from public.friendships 
  where (requester_id = auth.uid() and addressee_id = target_user_id)
     or (requester_id = target_user_id and addressee_id = auth.uid());
  
  if existing_request is not null then
    return json_build_object('success', false, 'message', 'Ya existe una solicitud o amistad con este usuario');
  end if;

  -- 3. Insert Request
  insert into public.friendships (requester_id, addressee_id, status)
  values (auth.uid(), target_user_id, 'pending');

  return json_build_object('success', true, 'message', 'Solicitud enviada');
end;
$function$
;

create or replace view "public"."v_friends" as  SELECT f.id AS friendship_id,
        CASE
            WHEN (f.requester_id = auth.uid()) THEN f.addressee_id
            ELSE f.requester_id
        END AS friend_id,
    p.full_name,
    p.email,
    f.status,
    f.created_at
   FROM (public.friendships f
     JOIN public.profiles p ON ((p.id =
        CASE
            WHEN (f.requester_id = auth.uid()) THEN f.addressee_id
            ELSE f.requester_id
        END)))
  WHERE (((f.requester_id = auth.uid()) OR (f.addressee_id = auth.uid())) AND (f.status = 'accepted'::text));


grant delete on table "public"."accounts" to "anon";

grant insert on table "public"."accounts" to "anon";

grant references on table "public"."accounts" to "anon";

grant select on table "public"."accounts" to "anon";

grant trigger on table "public"."accounts" to "anon";

grant truncate on table "public"."accounts" to "anon";

grant update on table "public"."accounts" to "anon";

grant delete on table "public"."accounts" to "authenticated";

grant insert on table "public"."accounts" to "authenticated";

grant references on table "public"."accounts" to "authenticated";

grant select on table "public"."accounts" to "authenticated";

grant trigger on table "public"."accounts" to "authenticated";

grant truncate on table "public"."accounts" to "authenticated";

grant update on table "public"."accounts" to "authenticated";

grant delete on table "public"."accounts" to "service_role";

grant insert on table "public"."accounts" to "service_role";

grant references on table "public"."accounts" to "service_role";

grant select on table "public"."accounts" to "service_role";

grant trigger on table "public"."accounts" to "service_role";

grant truncate on table "public"."accounts" to "service_role";

grant update on table "public"."accounts" to "service_role";

grant delete on table "public"."budget_members" to "anon";

grant insert on table "public"."budget_members" to "anon";

grant references on table "public"."budget_members" to "anon";

grant select on table "public"."budget_members" to "anon";

grant trigger on table "public"."budget_members" to "anon";

grant truncate on table "public"."budget_members" to "anon";

grant update on table "public"."budget_members" to "anon";

grant delete on table "public"."budget_members" to "authenticated";

grant insert on table "public"."budget_members" to "authenticated";

grant references on table "public"."budget_members" to "authenticated";

grant select on table "public"."budget_members" to "authenticated";

grant trigger on table "public"."budget_members" to "authenticated";

grant truncate on table "public"."budget_members" to "authenticated";

grant update on table "public"."budget_members" to "authenticated";

grant delete on table "public"."budget_members" to "service_role";

grant insert on table "public"."budget_members" to "service_role";

grant references on table "public"."budget_members" to "service_role";

grant select on table "public"."budget_members" to "service_role";

grant trigger on table "public"."budget_members" to "service_role";

grant truncate on table "public"."budget_members" to "service_role";

grant update on table "public"."budget_members" to "service_role";

grant delete on table "public"."budgets" to "anon";

grant insert on table "public"."budgets" to "anon";

grant references on table "public"."budgets" to "anon";

grant select on table "public"."budgets" to "anon";

grant trigger on table "public"."budgets" to "anon";

grant truncate on table "public"."budgets" to "anon";

grant update on table "public"."budgets" to "anon";

grant delete on table "public"."budgets" to "authenticated";

grant insert on table "public"."budgets" to "authenticated";

grant references on table "public"."budgets" to "authenticated";

grant select on table "public"."budgets" to "authenticated";

grant trigger on table "public"."budgets" to "authenticated";

grant truncate on table "public"."budgets" to "authenticated";

grant update on table "public"."budgets" to "authenticated";

grant delete on table "public"."budgets" to "service_role";

grant insert on table "public"."budgets" to "service_role";

grant references on table "public"."budgets" to "service_role";

grant select on table "public"."budgets" to "service_role";

grant trigger on table "public"."budgets" to "service_role";

grant truncate on table "public"."budgets" to "service_role";

grant update on table "public"."budgets" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."entities" to "anon";

grant insert on table "public"."entities" to "anon";

grant references on table "public"."entities" to "anon";

grant select on table "public"."entities" to "anon";

grant trigger on table "public"."entities" to "anon";

grant truncate on table "public"."entities" to "anon";

grant update on table "public"."entities" to "anon";

grant delete on table "public"."entities" to "authenticated";

grant insert on table "public"."entities" to "authenticated";

grant references on table "public"."entities" to "authenticated";

grant select on table "public"."entities" to "authenticated";

grant trigger on table "public"."entities" to "authenticated";

grant truncate on table "public"."entities" to "authenticated";

grant update on table "public"."entities" to "authenticated";

grant delete on table "public"."entities" to "service_role";

grant insert on table "public"."entities" to "service_role";

grant references on table "public"."entities" to "service_role";

grant select on table "public"."entities" to "service_role";

grant trigger on table "public"."entities" to "service_role";

grant truncate on table "public"."entities" to "service_role";

grant update on table "public"."entities" to "service_role";

grant delete on table "public"."friendships" to "anon";

grant insert on table "public"."friendships" to "anon";

grant references on table "public"."friendships" to "anon";

grant select on table "public"."friendships" to "anon";

grant trigger on table "public"."friendships" to "anon";

grant truncate on table "public"."friendships" to "anon";

grant update on table "public"."friendships" to "anon";

grant delete on table "public"."friendships" to "authenticated";

grant insert on table "public"."friendships" to "authenticated";

grant references on table "public"."friendships" to "authenticated";

grant select on table "public"."friendships" to "authenticated";

grant trigger on table "public"."friendships" to "authenticated";

grant truncate on table "public"."friendships" to "authenticated";

grant update on table "public"."friendships" to "authenticated";

grant delete on table "public"."friendships" to "service_role";

grant insert on table "public"."friendships" to "service_role";

grant references on table "public"."friendships" to "service_role";

grant select on table "public"."friendships" to "service_role";

grant trigger on table "public"."friendships" to "service_role";

grant truncate on table "public"."friendships" to "service_role";

grant update on table "public"."friendships" to "service_role";

grant delete on table "public"."goal_members" to "anon";

grant insert on table "public"."goal_members" to "anon";

grant references on table "public"."goal_members" to "anon";

grant select on table "public"."goal_members" to "anon";

grant trigger on table "public"."goal_members" to "anon";

grant truncate on table "public"."goal_members" to "anon";

grant update on table "public"."goal_members" to "anon";

grant delete on table "public"."goal_members" to "authenticated";

grant insert on table "public"."goal_members" to "authenticated";

grant references on table "public"."goal_members" to "authenticated";

grant select on table "public"."goal_members" to "authenticated";

grant trigger on table "public"."goal_members" to "authenticated";

grant truncate on table "public"."goal_members" to "authenticated";

grant update on table "public"."goal_members" to "authenticated";

grant delete on table "public"."goal_members" to "service_role";

grant insert on table "public"."goal_members" to "service_role";

grant references on table "public"."goal_members" to "service_role";

grant select on table "public"."goal_members" to "service_role";

grant trigger on table "public"."goal_members" to "service_role";

grant truncate on table "public"."goal_members" to "service_role";

grant update on table "public"."goal_members" to "service_role";

grant delete on table "public"."goal_participants" to "anon";

grant insert on table "public"."goal_participants" to "anon";

grant references on table "public"."goal_participants" to "anon";

grant select on table "public"."goal_participants" to "anon";

grant trigger on table "public"."goal_participants" to "anon";

grant truncate on table "public"."goal_participants" to "anon";

grant update on table "public"."goal_participants" to "anon";

grant delete on table "public"."goal_participants" to "authenticated";

grant insert on table "public"."goal_participants" to "authenticated";

grant references on table "public"."goal_participants" to "authenticated";

grant select on table "public"."goal_participants" to "authenticated";

grant trigger on table "public"."goal_participants" to "authenticated";

grant truncate on table "public"."goal_participants" to "authenticated";

grant update on table "public"."goal_participants" to "authenticated";

grant delete on table "public"."goal_participants" to "service_role";

grant insert on table "public"."goal_participants" to "service_role";

grant references on table "public"."goal_participants" to "service_role";

grant select on table "public"."goal_participants" to "service_role";

grant trigger on table "public"."goal_participants" to "service_role";

grant truncate on table "public"."goal_participants" to "service_role";

grant update on table "public"."goal_participants" to "service_role";

grant delete on table "public"."goals" to "anon";

grant insert on table "public"."goals" to "anon";

grant references on table "public"."goals" to "anon";

grant select on table "public"."goals" to "anon";

grant trigger on table "public"."goals" to "anon";

grant truncate on table "public"."goals" to "anon";

grant update on table "public"."goals" to "anon";

grant delete on table "public"."goals" to "authenticated";

grant insert on table "public"."goals" to "authenticated";

grant references on table "public"."goals" to "authenticated";

grant select on table "public"."goals" to "authenticated";

grant trigger on table "public"."goals" to "authenticated";

grant truncate on table "public"."goals" to "authenticated";

grant update on table "public"."goals" to "authenticated";

grant delete on table "public"."goals" to "service_role";

grant insert on table "public"."goals" to "service_role";

grant references on table "public"."goals" to "service_role";

grant select on table "public"."goals" to "service_role";

grant trigger on table "public"."goals" to "service_role";

grant truncate on table "public"."goals" to "service_role";

grant update on table "public"."goals" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."recurring_transactions" to "anon";

grant insert on table "public"."recurring_transactions" to "anon";

grant references on table "public"."recurring_transactions" to "anon";

grant select on table "public"."recurring_transactions" to "anon";

grant trigger on table "public"."recurring_transactions" to "anon";

grant truncate on table "public"."recurring_transactions" to "anon";

grant update on table "public"."recurring_transactions" to "anon";

grant delete on table "public"."recurring_transactions" to "authenticated";

grant insert on table "public"."recurring_transactions" to "authenticated";

grant references on table "public"."recurring_transactions" to "authenticated";

grant select on table "public"."recurring_transactions" to "authenticated";

grant trigger on table "public"."recurring_transactions" to "authenticated";

grant truncate on table "public"."recurring_transactions" to "authenticated";

grant update on table "public"."recurring_transactions" to "authenticated";

grant delete on table "public"."recurring_transactions" to "service_role";

grant insert on table "public"."recurring_transactions" to "service_role";

grant references on table "public"."recurring_transactions" to "service_role";

grant select on table "public"."recurring_transactions" to "service_role";

grant trigger on table "public"."recurring_transactions" to "service_role";

grant truncate on table "public"."recurring_transactions" to "service_role";

grant update on table "public"."recurring_transactions" to "service_role";

grant delete on table "public"."transactions" to "anon";

grant insert on table "public"."transactions" to "anon";

grant references on table "public"."transactions" to "anon";

grant select on table "public"."transactions" to "anon";

grant trigger on table "public"."transactions" to "anon";

grant truncate on table "public"."transactions" to "anon";

grant update on table "public"."transactions" to "anon";

grant delete on table "public"."transactions" to "authenticated";

grant insert on table "public"."transactions" to "authenticated";

grant references on table "public"."transactions" to "authenticated";

grant select on table "public"."transactions" to "authenticated";

grant trigger on table "public"."transactions" to "authenticated";

grant truncate on table "public"."transactions" to "authenticated";

grant update on table "public"."transactions" to "authenticated";

grant delete on table "public"."transactions" to "service_role";

grant insert on table "public"."transactions" to "service_role";

grant references on table "public"."transactions" to "service_role";

grant select on table "public"."transactions" to "service_role";

grant trigger on table "public"."transactions" to "service_role";

grant truncate on table "public"."transactions" to "service_role";

grant update on table "public"."transactions" to "service_role";


  create policy "accounts_delete"
  on "public"."accounts"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "accounts_insert"
  on "public"."accounts"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "accounts_select"
  on "public"."accounts"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "accounts_update"
  on "public"."accounts"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Members can view other members"
  on "public"."budget_members"
  as permissive
  for select
  to public
using ((budget_id IN ( SELECT public.get_accessible_budget_ids() AS get_accessible_budget_ids)));



  create policy "Owners can manage budget members"
  on "public"."budget_members"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.budgets
  WHERE ((budgets.id = budget_members.budget_id) AND (budgets.owner_id = auth.uid())))));



  create policy "budget_members_delete_policy"
  on "public"."budget_members"
  as permissive
  for delete
  to public
using (((user_id = auth.uid()) OR public.is_budget_owner(budget_id, auth.uid())));



  create policy "budget_members_insert_policy"
  on "public"."budget_members"
  as permissive
  for insert
  to public
with check (true);



  create policy "budget_members_select_policy"
  on "public"."budget_members"
  as permissive
  for select
  to public
using (((user_id = auth.uid()) OR public.is_budget_owner(budget_id, auth.uid())));



  create policy "Users can view budgets they belong to"
  on "public"."budgets"
  as permissive
  for select
  to public
using ((id IN ( SELECT public.get_accessible_budget_ids() AS get_accessible_budget_ids)));



  create policy "budgets_delete_policy"
  on "public"."budgets"
  as permissive
  for delete
  to public
using ((owner_id = auth.uid()));



  create policy "budgets_insert_policy"
  on "public"."budgets"
  as permissive
  for insert
  to public
with check ((owner_id = auth.uid()));



  create policy "budgets_select_policy"
  on "public"."budgets"
  as permissive
  for select
  to public
using (((owner_id = auth.uid()) OR public.is_budget_member(id, auth.uid())));



  create policy "budgets_update_policy"
  on "public"."budgets"
  as permissive
  for update
  to public
using ((owner_id = auth.uid()));



  create policy "Members can view categories"
  on "public"."categories"
  as permissive
  for select
  to public
using ((budget_id IN ( SELECT public.get_accessible_budget_ids() AS get_accessible_budget_ids)));



  create policy "Users can delete own categories"
  on "public"."categories"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert own categories"
  on "public"."categories"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update own categories"
  on "public"."categories"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own and system categories"
  on "public"."categories"
  as permissive
  for select
  to public
using (((user_id IS NULL) OR (auth.uid() = user_id)));



  create policy "categories_manage_policy"
  on "public"."categories"
  as permissive
  for all
  to public
using (public.has_budget_edit_permission(budget_id, auth.uid()));



  create policy "categories_view_policy"
  on "public"."categories"
  as permissive
  for select
  to public
using ((public.is_budget_owner(budget_id, auth.uid()) OR public.is_budget_member(budget_id, auth.uid())));



  create policy "Users can CRUD their own entities"
  on "public"."entities"
  as permissive
  for all
  to public
using ((auth.uid() = user_id));



  create policy "Users can create friend requests"
  on "public"."friendships"
  as permissive
  for insert
  to public
with check ((auth.uid() = requester_id));



  create policy "Users can update their received requests"
  on "public"."friendships"
  as permissive
  for update
  to public
using ((auth.uid() = addressee_id));



  create policy "Users can view their friendships"
  on "public"."friendships"
  as permissive
  for select
  to public
using (((auth.uid() = requester_id) OR (auth.uid() = addressee_id)));



  create policy "Members can view goal members"
  on "public"."goal_members"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.goal_members gm
  WHERE ((gm.goal_id = goal_members.goal_id) AND (gm.user_id = auth.uid())))));



  create policy "Owners can manage goal members"
  on "public"."goal_members"
  as permissive
  for all
  to public
using ((EXISTS ( SELECT 1
   FROM public.goals
  WHERE ((goals.id = goal_members.goal_id) AND (goals.user_id = auth.uid())))));



  create policy "Participants can see co-participants"
  on "public"."goal_participants"
  as permissive
  for select
  to public
using ((goal_id IN ( SELECT goal_participants_1.goal_id
   FROM public.goal_participants goal_participants_1
  WHERE (goal_participants_1.user_id = auth.uid()))));



  create policy "Users can manage their own participation"
  on "public"."goal_participants"
  as permissive
  for all
  to public
using ((user_id = auth.uid()));



  create policy "goal_participants_delete"
  on "public"."goal_participants"
  as permissive
  for delete
  to public
using ((user_id = auth.uid()));



  create policy "goal_participants_insert"
  on "public"."goal_participants"
  as permissive
  for insert
  to public
with check ((user_id = auth.uid()));



  create policy "goal_participants_select"
  on "public"."goal_participants"
  as permissive
  for select
  to public
using (((user_id = auth.uid()) OR (goal_id IN ( SELECT goals.id
   FROM public.goals
  WHERE (goals.user_id = auth.uid())))));



  create policy "Editors can update shared goals"
  on "public"."goals"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.goal_members
  WHERE ((goal_members.goal_id = goals.id) AND (goal_members.user_id = auth.uid()) AND (goal_members.role = ANY (ARRAY['owner'::text, 'editor'::text]))))));



  create policy "goals_delete"
  on "public"."goals"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "goals_insert"
  on "public"."goals"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "goals_select"
  on "public"."goals"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "goals_update"
  on "public"."goals"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can update their own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users can view profiles of connection"
  on "public"."profiles"
  as permissive
  for select
  to public
using (((auth.uid() = id) OR (EXISTS ( SELECT 1
   FROM public.friendships
  WHERE (((friendships.requester_id = auth.uid()) AND (friendships.addressee_id = profiles.id)) OR ((friendships.addressee_id = auth.uid()) AND (friendships.requester_id = profiles.id)))))));



  create policy "Users can view their own profile"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "Editors can delete recurring"
  on "public"."recurring_transactions"
  as permissive
  for delete
  to public
using ((((budget_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.budget_members
  WHERE ((budget_members.budget_id = recurring_transactions.budget_id) AND (budget_members.user_id = auth.uid()) AND (budget_members.role = ANY (ARRAY['owner'::text, 'editor'::text])))))) OR ((account_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.accounts
  WHERE ((accounts.id = recurring_transactions.account_id) AND (accounts.user_id = auth.uid())))))));



  create policy "Editors can insert recurring"
  on "public"."recurring_transactions"
  as permissive
  for insert
  to public
with check ((((budget_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.budget_members
  WHERE ((budget_members.budget_id = recurring_transactions.budget_id) AND (budget_members.user_id = auth.uid()) AND (budget_members.role = ANY (ARRAY['owner'::text, 'editor'::text])))))) OR ((account_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.accounts
  WHERE ((accounts.id = recurring_transactions.account_id) AND (accounts.user_id = auth.uid()))))) OR ((budget_id IS NULL) AND (account_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.accounts
  WHERE ((accounts.id = recurring_transactions.account_id) AND (accounts.user_id = auth.uid())))))));



  create policy "Editors can update recurring"
  on "public"."recurring_transactions"
  as permissive
  for update
  to public
using ((((budget_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.budget_members
  WHERE ((budget_members.budget_id = recurring_transactions.budget_id) AND (budget_members.user_id = auth.uid()) AND (budget_members.role = ANY (ARRAY['owner'::text, 'editor'::text])))))) OR ((account_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.accounts
  WHERE ((accounts.id = recurring_transactions.account_id) AND (accounts.user_id = auth.uid())))))));



  create policy "Members can view recurring"
  on "public"."recurring_transactions"
  as permissive
  for select
  to public
using ((((budget_id IS NOT NULL) AND (budget_id IN ( SELECT public.get_accessible_budget_ids() AS get_accessible_budget_ids))) OR ((account_id IS NOT NULL) AND (account_id IN ( SELECT public.get_accessible_account_ids() AS get_accessible_account_ids)))));



  create policy "transactions_delete"
  on "public"."transactions"
  as permissive
  for delete
  to public
using (((user_id = auth.uid()) OR ((account_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.accounts
  WHERE ((accounts.id = transactions.account_id) AND (accounts.user_id = auth.uid())))))));



  create policy "transactions_insert"
  on "public"."transactions"
  as permissive
  for insert
  to public
with check (((user_id = auth.uid()) OR ((account_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.accounts
  WHERE ((accounts.id = transactions.account_id) AND (accounts.user_id = auth.uid()))))) OR ((budget_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.budget_members
  WHERE ((budget_members.budget_id = transactions.budget_id) AND (budget_members.user_id = auth.uid()) AND (budget_members.role = ANY (ARRAY['owner'::text, 'editor'::text]))))))));



  create policy "transactions_select"
  on "public"."transactions"
  as permissive
  for select
  to public
using ((((user_id IS NOT NULL) AND (user_id = auth.uid())) OR ((account_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.accounts
  WHERE ((accounts.id = transactions.account_id) AND (accounts.user_id = auth.uid()))))) OR ((budget_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.budgets
  WHERE ((budgets.id = transactions.budget_id) AND ((budgets.owner_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.budget_members
          WHERE ((budget_members.budget_id = budgets.id) AND (budget_members.user_id = auth.uid())))))))))));



  create policy "transactions_update"
  on "public"."transactions"
  as permissive
  for update
  to public
using (((user_id = auth.uid()) OR ((account_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.accounts
  WHERE ((accounts.id = transactions.account_id) AND (accounts.user_id = auth.uid())))))));


CREATE TRIGGER on_budget_created AFTER INSERT ON public.budgets FOR EACH ROW EXECUTE FUNCTION public.handle_new_budget();

CREATE TRIGGER on_transaction_created AFTER INSERT ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.handle_balance_update();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


