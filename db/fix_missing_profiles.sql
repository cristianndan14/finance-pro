-- FIX: Insert missing profiles for existing users
-- Run this if you are getting "500" errors when creating accounts or data.

insert into public.profiles (id, email, full_name)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'full_name', 'Usuario')
from auth.users
where id not in (select id from public.profiles);

-- Also ensure the Trigger works for future users (idempotent check)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
