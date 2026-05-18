create unique index if not exists users_username_lower_key
on public.users (lower(username));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_requested_username text;
  v_base_username text;
  v_candidate_username text;
  v_suffix integer := 1;
begin
  v_requested_username := lower(
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      nullif(new.raw_user_meta_data->>'user_name', '')
    )
  );

  if v_requested_username is not null then
    insert into public.users (id, username)
    values (new.id, v_requested_username)
    on conflict (id) do nothing;
    return new;
  end if;

  v_base_username := lower(
    regexp_replace(
      coalesce(
        nullif(split_part(new.email, '@', 1), ''),
        'coleccionista'
      ),
      '[^a-z0-9_]+',
      '_',
      'g'
    )
  );

  v_base_username := trim(both '_' from v_base_username);
  if v_base_username = '' then
    v_base_username := 'coleccionista';
  end if;

  v_candidate_username := v_base_username;

  while exists (
    select 1
    from public.users u
    where lower(u.username) = lower(v_candidate_username)
  ) loop
    v_suffix := v_suffix + 1;
    v_candidate_username := left(v_base_username, greatest(1, 20 - length(v_suffix::text) - 1))
      || '_' || v_suffix::text;
  end loop;

  insert into public.users (id, username)
  values (new.id, v_candidate_username)
  on conflict (id) do nothing;

  return new;
end;
$function$;
