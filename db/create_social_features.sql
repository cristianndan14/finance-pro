-- 1. Friendships Table
create table public.friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) not null,
  addressee_id uuid references public.profiles(id) not null,
  status text not null check (status in ('pending', 'accepted')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Prevent duplicate requests
  unique(requester_id, addressee_id)
);

alter table public.friendships enable row level security;

-- Policies for Friendships
create policy "Users can view their friendships" on friendships
  for select using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

create policy "Users can create friend requests" on friendships
  for insert with check (
    auth.uid() = requester_id
  );

create policy "Users can update their received requests" on friendships
  for update using (
    auth.uid() = addressee_id
  );

-- 2. Function to Send Friend Request by Email
-- Uses SECURITY DEFINER to lookup profile by email (bypassing RLS)
create or replace function public.send_friend_request(target_email text)
returns json as $$
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
$$ language plpgsql security definer;

-- 3. Helper to get Friends (Accepted)
-- Returns profile info of friends
create or replace view public.v_friends as
select 
  f.id as friendship_id,
  case 
    when f.requester_id = auth.uid() then f.addressee_id 
    else f.requester_id 
  end as friend_id,
  p.full_name,
  p.email,
  f.status,
  f.created_at
from public.friendships f
join public.profiles p on p.id = (
  case 
    when f.requester_id = auth.uid() then f.addressee_id 
    else f.requester_id 
  end
)
where (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
and f.status = 'accepted';
