create table if not exists public.trade_proposals (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  creator_will_receive jsonb not null default '[]'::jsonb,
  creator_will_give jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  rejected_at timestamptz,
  cancelled_at timestamptz,
  expired_at timestamptz,
  constraint trade_proposals_different_users check (created_by_user_id <> target_user_id)
);

create index if not exists trade_proposals_created_by_idx on public.trade_proposals(created_by_user_id, created_at desc);
create index if not exists trade_proposals_target_idx on public.trade_proposals(target_user_id, created_at desc);
create index if not exists trade_proposals_status_idx on public.trade_proposals(status);

alter table public.trade_proposals enable row level security;

drop policy if exists "Users can view their trade proposals" on public.trade_proposals;
create policy "Users can view their trade proposals"
on public.trade_proposals
for select
using (auth.uid() = created_by_user_id or auth.uid() = target_user_id);

create or replace function public.trade_snapshot_code(p_item jsonb)
returns text
language sql
immutable
as $function$
  select coalesce(p_item->>'normalizedCode', p_item->>'code', p_item->>'codigoFigura')
$function$;

create or replace function public.trade_snapshot_quantity(p_item jsonb)
returns int
language sql
immutable
as $function$
  select greatest(1, coalesce((p_item->>'quantity')::int, 1))
$function$;

create or replace function public.compute_album_totals(p_collected jsonb)
returns table(unique_count int, repeated_count int)
language sql
stable
as $function$
  select
    coalesce(count(*) filter (where value::int > 0), 0)::int as unique_count,
    coalesce(sum(greatest(value::int - 1, 0)), 0)::int as repeated_count
  from jsonb_each_text(coalesce(p_collected, '{}'::jsonb));
$function$;

create or replace function public.create_trade_proposal(
  p_target_user_id uuid,
  p_creator_will_receive jsonb,
  p_creator_will_give jsonb
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_my_id uuid := auth.uid();
  v_id uuid;
begin
  if v_my_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_my_id = p_target_user_id then
    raise exception 'Cannot propose trade to yourself';
  end if;

  if jsonb_typeof(coalesce(p_creator_will_receive, '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_creator_will_give, '[]'::jsonb)) <> 'array' then
    raise exception 'Invalid trade snapshot';
  end if;

  if not exists (
    select 1 from public.users u where u.id = p_target_user_id
  ) then
    raise exception 'Target user not found';
  end if;

  insert into public.trade_proposals (
    created_by_user_id,
    target_user_id,
    creator_will_receive,
    creator_will_give
  )
  values (
    v_my_id,
    p_target_user_id,
    coalesce(p_creator_will_receive, '[]'::jsonb),
    coalesce(p_creator_will_give, '[]'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$function$;

create or replace function public.list_my_trade_proposals()
returns table(
  id uuid,
  direction text,
  status text,
  other_user_id uuid,
  other_username text,
  creator_will_receive jsonb,
  creator_will_give jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  cancelled_at timestamptz,
  expired_at timestamptz
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    tp.id,
    case when tp.created_by_user_id = auth.uid() then 'sent' else 'received' end as direction,
    tp.status,
    case when tp.created_by_user_id = auth.uid() then tp.target_user_id else tp.created_by_user_id end as other_user_id,
    coalesce(u.username, split_part(au.email, '@', 1)) as other_username,
    tp.creator_will_receive,
    tp.creator_will_give,
    tp.created_at,
    tp.updated_at,
    tp.accepted_at,
    tp.rejected_at,
    tp.cancelled_at,
    tp.expired_at
  from public.trade_proposals tp
  join public.users u on u.id = case when tp.created_by_user_id = auth.uid() then tp.target_user_id else tp.created_by_user_id end
  join auth.users au on au.id = u.id
  where auth.uid() in (tp.created_by_user_id, tp.target_user_id)
  order by tp.created_at desc;
$function$;

create or replace function public.reject_trade_proposal(p_proposal_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_my_id uuid := auth.uid();
begin
  update public.trade_proposals
  set status = 'rejected', rejected_at = now(), updated_at = now()
  where id = p_proposal_id
    and target_user_id = v_my_id
    and status = 'pending';

  if not found then
    raise exception 'Trade proposal not available';
  end if;
end;
$function$;

create or replace function public.cancel_trade_proposal(p_proposal_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_my_id uuid := auth.uid();
begin
  update public.trade_proposals
  set status = 'cancelled', cancelled_at = now(), updated_at = now()
  where id = p_proposal_id
    and created_by_user_id = v_my_id
    and status = 'pending';

  if not found then
    raise exception 'Trade proposal not available';
  end if;
end;
$function$;

create or replace function public.accept_trade_proposal(p_proposal_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_my_id uuid := auth.uid();
  v_proposal public.trade_proposals%rowtype;
  v_creator_collected jsonb;
  v_target_collected jsonb;
  v_item jsonb;
  v_code text;
  v_qty int;
  v_count int;
  v_creator_unique int;
  v_creator_repeated int;
  v_target_unique int;
  v_target_repeated int;
begin
  if v_my_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_proposal
  from public.trade_proposals
  where id = p_proposal_id
  for update;

  if not found or v_proposal.target_user_id <> v_my_id or v_proposal.status <> 'pending' then
    raise exception 'Trade proposal not available';
  end if;

  select collected into v_creator_collected
  from public.user_album_state
  where user_id = v_proposal.created_by_user_id
  for update;

  select collected into v_target_collected
  from public.user_album_state
  where user_id = v_proposal.target_user_id
  for update;

  v_creator_collected := coalesce(v_creator_collected, '{}'::jsonb);
  v_target_collected := coalesce(v_target_collected, '{}'::jsonb);

  -- Creator gives these stickers, so creator must still have them repeated.
  for v_item in select value from jsonb_array_elements(v_proposal.creator_will_give)
  loop
    v_code := public.trade_snapshot_code(v_item);
    v_qty := public.trade_snapshot_quantity(v_item);
    v_count := coalesce((v_creator_collected->>v_code)::int, 0);
    if v_code is null or v_count <= v_qty then
      raise exception 'Sticker no longer available: %', coalesce(v_code, 'unknown');
    end if;
  end loop;

  -- Target gives these stickers, so target must still have them repeated.
  for v_item in select value from jsonb_array_elements(v_proposal.creator_will_receive)
  loop
    v_code := public.trade_snapshot_code(v_item);
    v_qty := public.trade_snapshot_quantity(v_item);
    v_count := coalesce((v_target_collected->>v_code)::int, 0);
    if v_code is null or v_count <= v_qty then
      raise exception 'Sticker no longer available: %', coalesce(v_code, 'unknown');
    end if;
  end loop;

  -- Creator receives target stickers.
  for v_item in select value from jsonb_array_elements(v_proposal.creator_will_receive)
  loop
    v_code := public.trade_snapshot_code(v_item);
    v_qty := public.trade_snapshot_quantity(v_item);
    v_creator_collected := jsonb_set(
      v_creator_collected,
      array[v_code],
      to_jsonb(coalesce((v_creator_collected->>v_code)::int, 0) + v_qty),
      true
    );
    v_target_collected := jsonb_set(
      v_target_collected,
      array[v_code],
      to_jsonb(coalesce((v_target_collected->>v_code)::int, 0) - v_qty),
      true
    );
  end loop;

  -- Target receives creator stickers.
  for v_item in select value from jsonb_array_elements(v_proposal.creator_will_give)
  loop
    v_code := public.trade_snapshot_code(v_item);
    v_qty := public.trade_snapshot_quantity(v_item);
    v_target_collected := jsonb_set(
      v_target_collected,
      array[v_code],
      to_jsonb(coalesce((v_target_collected->>v_code)::int, 0) + v_qty),
      true
    );
    v_creator_collected := jsonb_set(
      v_creator_collected,
      array[v_code],
      to_jsonb(coalesce((v_creator_collected->>v_code)::int, 0) - v_qty),
      true
    );
  end loop;

  select unique_count, repeated_count
  into v_creator_unique, v_creator_repeated
  from public.compute_album_totals(v_creator_collected);

  select unique_count, repeated_count
  into v_target_unique, v_target_repeated
  from public.compute_album_totals(v_target_collected);

  update public.user_album_state
  set collected = v_creator_collected,
      unique_count = v_creator_unique,
      repeated_count = v_creator_repeated
  where user_id = v_proposal.created_by_user_id;

  update public.user_album_state
  set collected = v_target_collected,
      unique_count = v_target_unique,
      repeated_count = v_target_repeated
  where user_id = v_proposal.target_user_id;

  update public.trade_proposals
  set status = 'accepted', accepted_at = now(), updated_at = now()
  where id = p_proposal_id;
end;
$function$;
