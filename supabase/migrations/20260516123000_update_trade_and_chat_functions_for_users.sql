create or replace function public.get_trade_match(p_other_user_id uuid)
returns table(
  they_offer jsonb,
  i_offer jsonb,
  they_offer_count integer,
  i_offer_count integer
)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_my_id uuid;
  v_my_collected jsonb;
  v_their_collected jsonb;
  v_their_visible boolean;
  v_code text;
  v_my_count int;
  v_their_count int;
  v_they_offer jsonb := '{}'::jsonb;
  v_i_offer jsonb := '{}'::jsonb;
  v_they_offer_count int := 0;
  v_i_offer_count int := 0;
begin
  v_my_id := auth.uid();
  if v_my_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_my_id = p_other_user_id then
    raise exception 'Cannot match against yourself';
  end if;

  select
    (u.is_public_profile = true)
    or exists (
      select 1
      from public.group_members gm1
      join public.group_members gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = v_my_id
        and gm2.user_id = p_other_user_id
    )
  into v_their_visible
  from public.users u
  where u.id = p_other_user_id;

  if not coalesce(v_their_visible, false) then
    raise exception 'User not accessible';
  end if;

  select collected into v_my_collected
  from public.user_album_state
  where user_id = v_my_id;

  select collected into v_their_collected
  from public.user_album_state
  where user_id = p_other_user_id;

  v_my_collected := coalesce(v_my_collected, '{}'::jsonb);
  v_their_collected := coalesce(v_their_collected, '{}'::jsonb);

  for v_code in select jsonb_object_keys(v_their_collected)
  loop
    v_their_count := coalesce((v_their_collected->>v_code)::int, 0);
    v_my_count := coalesce((v_my_collected->>v_code)::int, 0);

    if v_their_count > 1 and v_my_count = 0 then
      v_they_offer := v_they_offer || jsonb_build_object(v_code, v_their_count - 1);
      v_they_offer_count := v_they_offer_count + 1;
    end if;
  end loop;

  for v_code in select jsonb_object_keys(v_my_collected)
  loop
    v_my_count := coalesce((v_my_collected->>v_code)::int, 0);
    v_their_count := coalesce((v_their_collected->>v_code)::int, 0);

    if v_my_count > 1 and v_their_count = 0 then
      v_i_offer := v_i_offer || jsonb_build_object(v_code, v_my_count - 1);
      v_i_offer_count := v_i_offer_count + 1;
    end if;
  end loop;

  return query select v_they_offer, v_i_offer, v_they_offer_count, v_i_offer_count;
end;
$function$;

create or replace function public.get_trade_candidates(p_limit integer default 20)
returns table(
  user_id uuid,
  username text,
  unique_count integer,
  percentage integer,
  they_offer_count integer,
  i_offer_count integer,
  match_score integer
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_my_id uuid;
  v_candidate record;
  v_match record;
begin
  v_my_id := auth.uid();
  if v_my_id is null then
    raise exception 'Not authenticated';
  end if;

  create temp table if not exists tmp_candidates (
    user_id uuid,
    username text,
    unique_count int,
    percentage int,
    they_offer_count int,
    i_offer_count int,
    match_score int
  ) on commit drop;

  delete from tmp_candidates where true;

  for v_candidate in
    select
      u.id,
      u.username,
      coalesce(uas.unique_count, 0) as u_count,
      case when coalesce(uas.total_needed, 0) > 0
        then round((coalesce(uas.unique_count, 0)::numeric / uas.total_needed::numeric) * 100, 0)::int
        else 0 end as pct
    from public.users u
    join public.user_album_state uas on uas.user_id = u.id
    where u.id != v_my_id
      and (
        u.is_public_profile = true
        or exists (
          select 1
          from public.group_members gm1
          join public.group_members gm2 on gm1.group_id = gm2.group_id
          where gm1.user_id = v_my_id
            and gm2.user_id = u.id
        )
      )
    limit 200
  loop
    select * from public.get_trade_match(v_candidate.id) into v_match;

    if v_match.they_offer_count > 0 and v_match.i_offer_count > 0 then
      insert into tmp_candidates values (
        v_candidate.id,
        v_candidate.username,
        v_candidate.u_count,
        v_candidate.pct,
        v_match.they_offer_count,
        v_match.i_offer_count,
        least(v_match.they_offer_count, v_match.i_offer_count) * 2
        + greatest(v_match.they_offer_count, v_match.i_offer_count)
      );
    end if;
  end loop;

  return query
    select * from tmp_candidates
    order by match_score desc
    limit p_limit;
end;
$function$;

create or replace function public.get_or_create_connection(p_other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_my_id uuid;
  v_user_a uuid;
  v_user_b uuid;
  v_connection_id uuid;
begin
  v_my_id := auth.uid();
  if v_my_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_my_id = p_other_user_id then
    raise exception 'Cannot connect to yourself';
  end if;

  if not exists (
    select 1
    from public.users u
    where u.id = p_other_user_id
      and (
        u.is_public_profile = true
        or exists (
          select 1
          from public.group_members gm1
          join public.group_members gm2 on gm1.group_id = gm2.group_id
          where gm1.user_id = v_my_id
            and gm2.user_id = p_other_user_id
        )
      )
  ) then
    raise exception 'User not accessible';
  end if;

  if v_my_id < p_other_user_id then
    v_user_a := v_my_id;
    v_user_b := p_other_user_id;
  else
    v_user_a := p_other_user_id;
    v_user_b := v_my_id;
  end if;

  insert into public.connections (user_a, user_b)
  values (v_user_a, v_user_b)
  on conflict (user_a, user_b) do update set user_a = excluded.user_a
  returning id into v_connection_id;

  return v_connection_id;
end;
$function$;

create or replace function public.list_my_connections()
returns table(
  connection_id uuid,
  other_user_id uuid,
  other_username text,
  last_message_content text,
  last_message_at timestamptz,
  last_message_sender uuid,
  unread_count integer
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    c.id as connection_id,
    case when c.user_a = auth.uid() then c.user_b else c.user_a end as other_user_id,
    u.username as other_username,
    lm.content as last_message_content,
    lm.created_at as last_message_at,
    lm.sender_id as last_message_sender,
    coalesce((
      select count(*)::int
      from public.messages m
      where m.connection_id = c.id
        and m.sender_id != auth.uid()
        and m.read_at is null
    ), 0) as unread_count
  from public.connections c
  join public.users u
    on u.id = case when c.user_a = auth.uid() then c.user_b else c.user_a end
  left join lateral (
    select content, created_at, sender_id
    from public.messages
    where connection_id = c.id
    order by created_at desc
    limit 1
  ) lm on true
  where c.user_a = auth.uid() or c.user_b = auth.uid()
  order by coalesce(lm.created_at, c.created_at) desc;
$function$;
