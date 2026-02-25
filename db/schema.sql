-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(full_name) >= 3)
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- 2. ACCOUNTS (Billeteras, Bancos, etc.)
create table public.accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  name text not null,
  type text not null check (type in ('bank', 'cash', 'crypto', 'wallet', 'other')),
  current_balance numeric default 0,
  currency text default 'ARS',
  created_at timestamp with time zone default now()
);

alter table public.accounts enable row level security;

create policy "Users can CRUD their own accounts" on accounts
  for all using (auth.uid() = user_id);

-- 3. BUDGETS
create table public.budgets (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) not null,
  name text not null,
  type text not null check (type in ('gasto', 'ahorro')),
  monthly_limit numeric,
  base_currency text default 'ARS',
  invite_token uuid default gen_random_uuid(),
  created_at timestamp with time zone default now()
);

alter table public.budgets enable row level security;

-- 4. BUDGET MEMBERS (Collaboration)
create table public.budget_members (
  budget_id uuid references public.budgets(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  joined_at timestamp with time zone default now(),
  primary key (budget_id, user_id)
);

alter table public.budget_members enable row level security;

-- Policies for Budgets based on Membership
create policy "Users can view budgets they belong to" on budgets
  for select using (
    auth.uid() = owner_id or 
    exists (
      select 1 from budget_members 
      where budget_id = budgets.id and user_id = auth.uid()
    )
  );

create policy "Owners can update budgets" on budgets
  for update using (auth.uid() = owner_id);

create policy "Owners can delete budgets" on budgets
  for delete using (auth.uid() = owner_id);

create policy "Users can create budgets" on budgets
  for insert with check (auth.uid() = owner_id);

-- Policies for Budget Members
create policy "Members can view other members" on budget_members
  for select using (
    exists (
      select 1 from budget_members bm
      where bm.budget_id = budget_members.budget_id 
      and bm.user_id = auth.uid()
    )
  );

-- 5. CATEGORIES
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  budget_id uuid references public.budgets(id) on delete cascade not null,
  name text not null,
  icon text not null, -- Lucide icon name
  color text not null, -- Hex color or Tailwind class
  created_at timestamp with time zone default now()
);

alter table public.categories enable row level security;

create policy "Members can view categories" on categories
  for select using (
    exists (
      select 1 from budget_members 
      where budget_id = categories.budget_id and user_id = auth.uid()
    )
  );

create policy "Editors/Owners can manage categories" on categories
  for all using (
    exists (
      select 1 from budget_members 
      where budget_id = categories.budget_id 
      and user_id = auth.uid()
      and role in ('owner', 'editor')
    )
  );

-- 6. RECURRING TRANSACTIONS
create table public.recurring_transactions (
  id uuid default gen_random_uuid() primary key,
  budget_id uuid references public.budgets(id) on delete cascade,
  category_id uuid references public.categories(id),
  account_id uuid references public.accounts(id),
  amount numeric not null,
  type text not null check (type in ('ingreso', 'egreso')),
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  next_execution_date date not null,
  status text default 'active' check (status in ('active', 'paused')),
  description text,
  created_at timestamp with time zone default now()
);

alter table public.recurring_transactions enable row level security;

create policy "Members can view recurring" on recurring_transactions
  for select using (
    exists (
      select 1 from budget_members where budget_id = recurring_transactions.budget_id and user_id = auth.uid()
    ) or 
    (account_id is not null and exists (select 1 from accounts where id = recurring_transactions.account_id and user_id = auth.uid()))
  );

-- 7. TRANSACTIONS
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  budget_id uuid references public.budgets(id) on delete cascade,
  category_id uuid references public.categories(id),
  account_id uuid references public.accounts(id),
  transfer_target_id uuid references public.accounts(id), -- For transfers
  recurring_id uuid references public.recurring_transactions(id),
  type text not null check (type in ('ingreso', 'egreso')),
  amount numeric not null,
  currency text default 'ARS',
  description text,
  is_transfer boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.transactions enable row level security;

create policy "Members can view transactions" on transactions
  for select using (
    (budget_id is not null and exists (
      select 1 from budget_members where budget_id = transactions.budget_id and user_id = auth.uid()
    )) or
    (account_id is not null and exists (
      select 1 from accounts where id = transactions.account_id and user_id = auth.uid()
    ))
  );

create policy "Editors can insert transactions" on transactions
  for insert with check (
    -- Permiso por Budget (Owner/Editor)
    (budget_id is not null and exists (
      select 1 from budget_members 
      where budget_id = transactions.budget_id 
      and user_id = auth.uid() 
      and role in ('owner', 'editor')
    ))
    OR
    -- Permiso por Cuenta (Owner)
    (account_id is not null and exists (
      select 1 from accounts 
      where id = transactions.account_id 
      and user_id = auth.uid()
    ))
  );

-- AUTOMATION

-- A. Trigger for User Creation -> Profile
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- B. Trigger for New Budget -> Auto Add Owner + Default Categories
create or replace function public.handle_new_budget()
returns trigger as $$
begin
  -- 1. Add Creator as Owner in members table
  insert into public.budget_members (budget_id, user_id, role)
  values (new.id, new.owner_id, 'owner');

  -- 2. Insert Default Categories
  insert into public.categories (budget_id, name, icon, color) values
    (new.id, 'Vivienda', 'Home', 'blue'),
    (new.id, 'Alimentación', 'Utensils', 'orange'),
    (new.id, 'Transporte', 'Car', 'gray'),
    (new.id, 'Salud', 'HeartPulse', 'red'),
    (new.id, 'Ocio', 'Ticket', 'purple'),
    (new.id, 'Suscripciones', 'Zap', 'yellow'),
    (new.id, 'Otros', 'MoreHorizontal', 'slate');

  return new;
end;
$$ language plpgsql security definer;

create trigger on_budget_created
  after insert on public.budgets
  for each row execute procedure public.handle_new_budget();

-- C. Trigger: Update Account Balance on Transaction
create or replace function public.handle_balance_update()
returns trigger as $$
begin
  -- Si es un ingreso, sumar al balance
  if new.type = 'ingreso' then
    update public.accounts set current_balance = current_balance + new.amount
    where id = new.account_id;
  end if;

  -- Si es un egreso, restar al balance
  if new.type = 'egreso' then
    update public.accounts set current_balance = current_balance - new.amount
    where id = new.account_id;
  end if;

  -- Si es transferencia (logica simplificada, asume que 'egreso' desde origen y 'ingreso' a destino se manejan por separado o requieren logica especial)
  -- NOTA: Para mantenerlo simple, la aplicacion deberia insertar DOS transacciones para una transferencia o manejarlo aqui. 
  -- Para V1, asumiremos que si is_transfer = true, el 'account_id' decrementa y 'transfer_target_id' incrementa.
  if new.is_transfer = true and new.transfer_target_id is not null then
     -- Restar de origen (ya hecho arriba si type='egreso', pero transferencias suelen ser movimientos neutrales en budget, pero fisicos en cuenta)
     -- Ajustaremos la logica: Si es transferencia, ignoramos el type para budget, pero movemos plata.
     
     -- Reset previos updates si calzan
     -- Mejor approach: La APP inserta un registro con is_transfer. 
     -- Si type='egreso' y is_transfer=true: Resta de account_id, Suma a transfer_target_id
     if new.type = 'egreso' then
        update public.accounts set current_balance = current_balance + new.amount where id = new.transfer_target_id;
     end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Nota: Trigger de balance es complejo y propenso a errores de concurrencia. Para MVP V1, mejor calcular balance "on the fly" o manejarlo en Application Layer. 
-- DEJAMOS COMENTADO EL TRIGGER DE CALCULO DE BALANCE para evitar bugs criticos ahora.
-- create trigger on_transaction_created after insert on public.transactions ...
