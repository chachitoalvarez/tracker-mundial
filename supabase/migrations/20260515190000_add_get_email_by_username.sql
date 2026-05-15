create or replace function public.get_email_by_username(p_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select lower(u.email)
  from public.users p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(trim(leading '@' from trim(p_username)))
  limit 1;
$$;

revoke all on function public.get_email_by_username(text) from public;
grant execute on function public.get_email_by_username(text) to anon, authenticated;
