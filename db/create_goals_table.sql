-- Create Goals table for Strict Account Linking (Option A)
create table public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  name text not null,
  target_amount numeric(20, 2),
  deadline date,
  account_id uuid references public.accounts(id) on delete cascade not null, -- Strict 1-to-1 link
  icon text,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraint: One Account can only be linked to One Goal (Strict Option A)
  constraint goals_account_id_key unique (account_id)
);

-- Add RLS Policies
alter table public.goals enable row level security;

create policy "Users can view their own goals"
on public.goals for select
using (auth.uid() = user_id);

create policy "Users can insert their own goals"
on public.goals for insert
with check (auth.uid() = user_id);

create policy "Users can update their own goals"
on public.goals for update
using (auth.uid() = user_id);

create policy "Users can delete their own goals"
on public.goals for delete
using (auth.uid() = user_id);
