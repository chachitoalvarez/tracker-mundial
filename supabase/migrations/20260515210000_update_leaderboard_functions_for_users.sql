create or replace function public.get_leaderboard_global(limit_count integer default 100)
returns table(
  user_id uuid,
  username text,
  unique_count integer,
  repeated_count integer,
  total_needed integer,
  percentage numeric
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    s.user_id,
    coalesce(p.username, split_part(u.email, '@', 1)) as username,
    s.unique_count,
    s.repeated_count,
    s.total_needed,
    case
      when s.total_needed = 0 then 0
      else round((s.unique_count::numeric / s.total_needed) * 100)
    end as percentage
  from public.user_album_state s
  join auth.users u on u.id = s.user_id
  left join public.users p on p.id = s.user_id
  where coalesce(p.is_public_profile, true) = true
  order by s.unique_count desc
  limit limit_count;
$function$;

create or replace function public.get_group_leaderboard(p_group_id uuid)
returns table(
  user_id uuid,
  username text,
  unique_count integer,
  repeated_count integer,
  total_needed integer,
  percentage numeric
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    s.user_id,
    coalesce(p.username, split_part(u.email, '@', 1)) as username,
    s.unique_count,
    s.repeated_count,
    s.total_needed,
    case
      when s.total_needed = 0 then 0
      else round((s.unique_count::numeric / s.total_needed) * 100)
    end as percentage
  from public.group_members gm
  join public.user_album_state s on s.user_id = gm.user_id
  join auth.users u on u.id = gm.user_id
  left join public.users p on p.id = gm.user_id
  where gm.group_id = p_group_id
    and gm.user_id is not null;
$function$;
