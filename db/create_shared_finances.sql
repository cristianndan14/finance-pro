-- 1. GOAL MEMBERS (Collaboration for Goals)
create table public.goal_members (
  goal_id uuid references public.goals(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  joined_at timestamp with time zone default now(),
  primary key (goal_id, user_id)
);

alter table public.goal_members enable row level security;

-- 2. Policies for GOAL MEMBERS
-- Members can view other members of the same goal
create policy "Members can view goal members" on goal_members
  for select using (
    exists (
      select 1 from goal_members gm
      where gm.goal_id = goal_members.goal_id 
      and gm.user_id = auth.uid()
    )
  );

-- Only Owners can add/remove members
create policy "Owners can manage goal members" on goal_members
  for all using (
    exists (
      select 1 from public.goals 
      where id = goal_members.goal_id 
      and user_id = auth.uid()
    )
  );

-- 3. Policies for BUDGET MEMBERS (Fixing missing management policies)
create policy "Owners can manage budget members" on budget_members
  for all using (
    exists (
      select 1 from public.budgets 
      where id = budget_members.budget_id 
      and owner_id = auth.uid()
    )
  );

-- 4. Update GOALS policies to respect Membership
-- (Assuming original goals policies were basic owner-only)

-- Drop existing owner-only policies if needed (or just add OR conditions)
-- For this script, we'll create new "Members" policies.

create policy "Members can view shared goals" on public.goals
  for select using (
    exists (
      select 1 from goal_members 
      where goal_id = goals.id and user_id = auth.uid()
    )
  );

create policy "Editors can update shared goals" on public.goals
  for update using (
    exists (
      select 1 from goal_members 
      where goal_id = goals.id 
      and user_id = auth.uid()
      and role in ('owner', 'editor')
    )
  );

-- 5. Helper Function to Add Member by Email
-- Easier to call from UI: Add friend to budget/goal
create or replace function public.add_member_by_email(
  resource_type text, -- 'budget' or 'goal'
  resource_id uuid,
  target_email text,
  target_role text default 'viewer'
)
returns json as $$
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
$$ language plpgsql security definer;
