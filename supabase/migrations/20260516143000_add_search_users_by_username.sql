create or replace function public.search_users_by_username(p_query text, p_limit integer default 5)
returns table(
  user_id uuid,
  username text
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    u.id as user_id,
    u.username
  from public.users u
  where length(trim(coalesce(p_query, ''))) >= 2
    and u.username is not null
    and u.username ilike trim(p_query) || '%'
  order by
    case when lower(u.username) = lower(trim(p_query)) then 0 else 1 end,
    u.username asc
  limit greatest(1, least(coalesce(p_limit, 5), 10));
$function$;
