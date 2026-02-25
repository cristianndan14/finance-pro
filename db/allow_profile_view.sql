-- Allow users to view profiles of people they have a friendship connection with (pending or accepted)
create policy "Users can view profiles of connection"
on public.profiles
for select
using (
  auth.uid() = id -- Can view own profile
  or exists (
    select 1 from public.friendships
    where (requester_id = auth.uid() and addressee_id = profiles.id)
    or (addressee_id = auth.uid() and requester_id = profiles.id)
  )
);
