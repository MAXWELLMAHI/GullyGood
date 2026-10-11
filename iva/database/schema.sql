-- IVA Phase 1 MVP schema
-- Run this file first in your Supabase SQL editor.

create extension if not exists postgis;
create extension if not exists pgcrypto;

create or replace function public.default_operating_hours()
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'timezone', 'Asia/Kolkata',
    'mon', jsonb_build_object('open', '09:00', 'close', '18:00'),
    'tue', jsonb_build_object('open', '09:00', 'close', '18:00'),
    'wed', jsonb_build_object('open', '09:00', 'close', '18:00'),
    'thu', jsonb_build_object('open', '09:00', 'close', '18:00'),
    'fri', jsonb_build_object('open', '09:00', 'close', '18:00'),
    'sat', jsonb_build_object('open', '09:00', 'close', '15:00'),
    'sun', jsonb_build_object('open', '10:00', 'close', '14:00')
  )
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('donor', 'ngo', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'ngo_verification_status') then
    create type public.ngo_verification_status as enum ('pending', 'verified', 'rejected', 'suspended');
  end if;

  if not exists (select 1 from pg_type where typname = 'donation_status') then
    create type public.donation_status as enum ('submitted', 'live', 'locked', 'picked_up', 'cancelled', 'expired');
  end if;

  if not exists (select 1 from pg_type where typname = 'claim_status') then
    create type public.claim_status as enum ('locked', 'completed', 'cancelled', 'timed_out');
  end if;

  if not exists (select 1 from pg_type where typname = 'item_quality') then
    create type public.item_quality as enum ('new', 'excellent', 'good', 'fair');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_geography_from_coords()
returns trigger
language plpgsql
as $$
begin
  if new.latitude is null or new.longitude is null then
    new.location = null;
  else
    new.location = st_setsrid(st_makepoint(new.longitude, new.latitude), 4326)::geography;
  end if;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'donor',
  city text,
  pincode text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ngos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null default 'Mumbai',
  pincode text not null,
  ngo_darpan_id text,
  registration_number text,
  contact_phone text,
  service_radius_km numeric(5, 2) not null default 5,
  accepted_categories text[] not null default '{}'::text[],
  operating_hours jsonb not null default public.default_operating_hours(),
  daily_pickup_capacity integer not null default 10 check (daily_pickup_capacity > 0),
  rating_average numeric(3, 2) not null default 0 check (rating_average between 0 and 5),
  completion_rate numeric(5, 4) not null default 0 check (completion_rate between 0 and 1),
  verified_status public.ngo_verification_status not null default 'pending',
  latitude double precision,
  longitude double precision,
  location geography(point, 4326),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ngo_staff (
  id uuid primary key default gen_random_uuid(),
  ngo_id uuid not null references public.ngos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  staff_role text not null default 'coordinator',
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (ngo_id, user_id)
);

create table if not exists public.donation_listings (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  quantity integer not null check (quantity > 0),
  quality public.item_quality not null,
  description text,
  address_line1 text not null,
  landmark text,
  locality text not null,
  city text not null default 'Mumbai',
  pincode text not null check (char_length(pincode) = 6),
  latitude double precision not null,
  longitude double precision not null,
  location geography(point, 4326),
  pickup_window_start timestamptz not null,
  pickup_window_end timestamptz not null,
  status public.donation_status not null default 'submitted',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  check (pickup_window_end > pickup_window_start)
);

create table if not exists public.donation_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.donation_listings (id) on delete cascade,
  storage_path text not null unique,
  mime_type text,
  size_bytes integer,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.donation_listings (id) on delete cascade,
  ngo_id uuid not null references public.ngos (id) on delete cascade,
  locked_by_user_id uuid not null references auth.users (id) on delete cascade,
  state public.claim_status not null default 'locked',
  locked_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  cancelled_at timestamptz,
  timed_out_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pickup_tasks (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.donation_listings (id) on delete cascade,
  claim_id uuid not null unique references public.claims (id) on delete cascade,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  status text not null default 'scheduled',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.donation_listings (id) on delete cascade,
  claim_id uuid references public.claims (id) on delete set null,
  author_id uuid not null references auth.users (id) on delete cascade,
  target_role public.app_role not null,
  rating smallint not null check (rating between 1 and 5),
  comments text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (listing_id, author_id, target_role)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  channel text not null default 'in_app',
  delivery_status text not null default 'pending',
  title text not null,
  body text not null,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  deliver_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.donation_listings (id) on delete cascade,
  claim_id uuid not null references public.claims (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  sender_role public.app_role not null,
  message text not null check (char_length(btrim(message)) between 1 and 1000),
  shared_phone text,
  created_at timestamptz not null default timezone('utc', now()),
  check (sender_role in ('donor'::public.app_role, 'ngo'::public.app_role))
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists ngos_verified_status_idx on public.ngos (verified_status);
create index if not exists ngos_city_idx on public.ngos (city);
create index if not exists ngos_accepted_categories_idx on public.ngos using gin (accepted_categories);
create index if not exists donation_listings_status_idx on public.donation_listings (status);
create index if not exists donation_listings_category_idx on public.donation_listings (category);
create index if not exists donation_listings_created_at_idx on public.donation_listings (created_at desc);
create index if not exists donation_listings_pickup_window_idx on public.donation_listings (pickup_window_start, pickup_window_end);
create index if not exists donation_listings_location_gix on public.donation_listings using gist (location);
create index if not exists ngos_location_gix on public.ngos using gist (location);
create index if not exists claims_listing_idx on public.claims (listing_id);
create index if not exists claims_ngo_idx on public.claims (ngo_id);
create index if not exists claims_state_idx on public.claims (state);
create unique index if not exists claims_single_active_lock_idx on public.claims (listing_id) where state = 'locked';
create unique index if not exists donation_images_primary_per_listing_idx on public.donation_images (listing_id) where is_primary = true;
create index if not exists feedback_listing_idx on public.feedback (listing_id);
create index if not exists notifications_delivery_status_idx on public.notifications (delivery_status, deliver_at);
create index if not exists chat_messages_listing_created_at_idx on public.chat_messages (listing_id, created_at);
create index if not exists chat_messages_claim_idx on public.chat_messages (claim_id);
create index if not exists chat_messages_sender_idx on public.chat_messages (sender_id, created_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists ngos_set_updated_at on public.ngos;
create trigger ngos_set_updated_at
before update on public.ngos
for each row
execute function public.set_updated_at();

drop trigger if exists ngos_sync_geography on public.ngos;
create trigger ngos_sync_geography
before insert or update of latitude, longitude on public.ngos
for each row
execute function public.sync_geography_from_coords();

drop trigger if exists donation_listings_set_updated_at on public.donation_listings;
create trigger donation_listings_set_updated_at
before update on public.donation_listings
for each row
execute function public.set_updated_at();

drop trigger if exists donation_listings_sync_geography on public.donation_listings;
create trigger donation_listings_sync_geography
before insert or update of latitude, longitude on public.donation_listings
for each row
execute function public.sync_geography_from_coords();

drop trigger if exists claims_set_updated_at on public.claims;
create trigger claims_set_updated_at
before update on public.claims
for each row
execute function public.set_updated_at();

drop trigger if exists pickup_tasks_set_updated_at on public.pickup_tasks;
create trigger pickup_tasks_set_updated_at
before update on public.pickup_tasks
for each row
execute function public.set_updated_at();

create or replace function public.feedback_target_ngo_id(
  feedback_claim_id uuid,
  feedback_listing_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.ngo_id
  from public.claims c
  where c.id = coalesce(
    feedback_claim_id,
    (
      select c2.id
      from public.claims c2
      where c2.listing_id = feedback_listing_id
      order by c2.created_at desc
      limit 1
    )
  )
  limit 1
$$;

create or replace function public.refresh_ngo_metrics(target_ngo_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rating_value numeric(3, 2);
  completion_value numeric(5, 4);
begin
  if target_ngo_id is null then
    return;
  end if;

  select coalesce(round(avg(f.rating)::numeric, 2), 0)
  into rating_value
  from public.feedback f
  join public.claims c on c.id = coalesce(
    f.claim_id,
    (
      select c2.id
      from public.claims c2
      where c2.listing_id = f.listing_id
      order by c2.created_at desc
      limit 1
    )
  )
  where c.ngo_id = target_ngo_id
    and f.target_role = 'ngo'::public.app_role;

  select coalesce(
    round(
      (
        count(*) filter (where c.state = 'completed'::public.claim_status)
      )::numeric
      / nullif(
        (
          count(*) filter (
            where c.state in (
              'completed'::public.claim_status,
              'cancelled'::public.claim_status,
              'timed_out'::public.claim_status
            )
          )
        )::numeric,
        0
      ),
      4
    ),
    0
  )
  into completion_value
  from public.claims c
  where c.ngo_id = target_ngo_id;

  update public.ngos
  set
    rating_average = coalesce(rating_value, 0),
    completion_rate = coalesce(completion_value, 0)
  where id = target_ngo_id;
end;
$$;

create or replace function public.refresh_ngo_metrics_from_claims()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_ngo_metrics(old.ngo_id);
    return old;
  end if;

  if tg_op = 'UPDATE' and old.ngo_id is distinct from new.ngo_id then
    perform public.refresh_ngo_metrics(old.ngo_id);
  end if;

  perform public.refresh_ngo_metrics(new.ngo_id);
  return new;
end;
$$;

create or replace function public.refresh_ngo_metrics_from_feedback()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_ngo_id uuid;
  previous_ngo_id uuid;
begin
  if tg_op = 'DELETE' then
    target_ngo_id := public.feedback_target_ngo_id(old.claim_id, old.listing_id);
    perform public.refresh_ngo_metrics(target_ngo_id);
    return old;
  end if;

  if tg_op = 'UPDATE' then
    previous_ngo_id := public.feedback_target_ngo_id(old.claim_id, old.listing_id);
    if previous_ngo_id is not null then
      perform public.refresh_ngo_metrics(previous_ngo_id);
    end if;
  end if;

  target_ngo_id := public.feedback_target_ngo_id(new.claim_id, new.listing_id);
  perform public.refresh_ngo_metrics(target_ngo_id);
  return new;
end;
$$;

drop trigger if exists claims_refresh_ngo_metrics on public.claims;
create trigger claims_refresh_ngo_metrics
after insert or update or delete on public.claims
for each row
execute function public.refresh_ngo_metrics_from_claims();

drop trigger if exists feedback_refresh_ngo_metrics on public.feedback;
create trigger feedback_refresh_ngo_metrics
after insert or update or delete on public.feedback
for each row
execute function public.refresh_ngo_metrics_from_feedback();

create or replace function public.log_audit_event(
  event_action text,
  event_entity_type text,
  event_entity_id uuid,
  event_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_id uuid;
begin
  insert into public.audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    auth.uid(),
    event_action,
    event_entity_type,
    event_entity_id,
    coalesce(event_metadata, '{}'::jsonb)
  )
  returning id into audit_id;

  return audit_id;
end;
$$;

create or replace function public.queue_notification(
  target_user_id uuid,
  notification_kind text,
  notification_title text,
  notification_body text,
  notification_href text default null,
  notification_channel text default 'in_app',
  notification_metadata jsonb default '{}'::jsonb,
  scheduled_for timestamptz default timezone('utc', now())
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_id uuid;
begin
  insert into public.notifications (
    user_id,
    kind,
    channel,
    delivery_status,
    title,
    body,
    href,
    metadata,
    deliver_at
  )
  values (
    target_user_id,
    notification_kind,
    notification_channel,
    'pending',
    notification_title,
    notification_body,
    notification_href,
    coalesce(notification_metadata, '{}'::jsonb),
    scheduled_for
  )
  returning id into notification_id;

  return notification_id;
end;
$$;

create or replace function public.pickup_window_availability_score(
  ngo_operating_hours jsonb,
  pickup_window_start timestamptz,
  pickup_window_end timestamptz
)
returns double precision
language plpgsql
stable
as $$
declare
  zone_name text := coalesce(ngo_operating_hours ->> 'timezone', 'Asia/Kolkata');
  local_start timestamp without time zone := pickup_window_start at time zone zone_name;
  local_end timestamp without time zone := pickup_window_end at time zone zone_name;
  day_key text;
  day_schedule jsonb;
  opens_at time;
  closes_at time;
begin
  day_key := case extract(isodow from local_start)
    when 1 then 'mon'
    when 2 then 'tue'
    when 3 then 'wed'
    when 4 then 'thu'
    when 5 then 'fri'
    when 6 then 'sat'
    else 'sun'
  end;

  day_schedule := ngo_operating_hours -> day_key;

  if day_schedule is null then
    return 0.7;
  end if;

  opens_at := coalesce((day_schedule ->> 'open')::time, '09:00'::time);
  closes_at := coalesce((day_schedule ->> 'close')::time, '18:00'::time);

  if local_start::date <> local_end::date then
    return 0.3;
  end if;

  if local_start::time >= opens_at and local_end::time <= closes_at then
    return 1;
  end if;

  if local_start::time < closes_at and local_end::time > opens_at then
    return 0.45;
  end if;

  return 0;
end;
$$;

create or replace function public.ngo_capacity_score(
  target_ngo_id uuid,
  pickup_start timestamptz
)
returns double precision
language sql
stable
security definer
set search_path = public
as $$
  with ngo_base as (
    select daily_pickup_capacity
    from public.ngos
    where id = target_ngo_id
  ),
  active_claims as (
    select count(*)::double precision as active_count
    from public.claims c
    join public.pickup_tasks pt on pt.claim_id = c.id
    where c.ngo_id = target_ngo_id
      and c.state = 'locked'::public.claim_status
      and (pt.scheduled_start at time zone 'Asia/Kolkata')::date = (pickup_start at time zone 'Asia/Kolkata')::date
  )
  select case
    when ngo_base.daily_pickup_capacity is null or ngo_base.daily_pickup_capacity <= 0 then 0
    else greatest(
      0,
      least(
        1,
        (ngo_base.daily_pickup_capacity - coalesce(active_claims.active_count, 0))
        / ngo_base.daily_pickup_capacity::double precision
      )
    )
  end
  from ngo_base
  left join active_claims on true
$$;

create or replace function public.normalize_app_role(raw_role text)
returns public.app_role
language sql
immutable
as $$
  select case lower(coalesce(raw_role, ''))
    when 'ngo' then 'ngo'::public.app_role
    when 'admin' then 'admin'::public.app_role
    else 'donor'::public.app_role
  end
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_role_input text;
begin
  resolved_role_input := coalesce(
    nullif(new.raw_user_meta_data ->> 'role', ''),
    nullif(new.raw_app_meta_data ->> 'role', '')
  );

  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', '')
    ),
    coalesce(
      nullif(new.phone, ''),
      nullif(new.raw_user_meta_data ->> 'phone', '')
    ),
    public.normalize_app_role(resolved_role_input)
  )
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    role = case
      when resolved_role_input is not null then excluded.role
      else public.profiles.role
    end,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.sync_profile_from_auth_user(
  target_user_id uuid default auth.uid()
)
returns public.app_role
language plpgsql
security definer
set search_path = ''
as $$
declare
  auth_user auth.users%rowtype;
  resolved_role_input text;
  resolved_role public.app_role;
begin
  if target_user_id is null then
    return null;
  end if;

  select *
  into auth_user
  from auth.users
  where id = target_user_id;

  if not found then
    return null;
  end if;

  resolved_role_input := coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'role', ''),
    nullif(auth_user.raw_app_meta_data ->> 'role', '')
  );
  resolved_role := public.normalize_app_role(resolved_role_input);

  insert into public.profiles (id, full_name, phone, role)
  values (
    auth_user.id,
    coalesce(
      nullif(auth_user.raw_user_meta_data ->> 'full_name', ''),
      nullif(auth_user.raw_user_meta_data ->> 'name', ''),
      nullif(split_part(coalesce(auth_user.email, ''), '@', 1), '')
    ),
    coalesce(
      nullif(auth_user.phone, ''),
      nullif(auth_user.raw_user_meta_data ->> 'phone', '')
    ),
    resolved_role
  )
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    role = case
      when resolved_role_input is not null then resolved_role
      else public.profiles.role
    end,
    updated_at = timezone('utc', now());

  return (
    select p.role
    from public.profiles p
    where p.id = auth_user.id
  );
end;
$$;

do $$
begin
  begin
    drop trigger if exists on_auth_user_created on auth.users;
    create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();
  exception
    when undefined_table or insufficient_privilege then
      raise notice 'Skipping auth.users trigger setup. Use public.sync_profile_from_auth_user() as the compatibility fallback.';
  end;
end
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = 'admin'::public.app_role, false)
$$;

create or replace function public.current_verified_ngo_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ns.ngo_id
  from public.ngo_staff ns
  join public.ngos n on n.id = ns.ngo_id
  where ns.user_id = auth.uid()
    and n.verified_status = 'verified'::public.ngo_verification_status
  order by ns.is_primary desc, ns.created_at asc
  limit 1
$$;

create or replace function public.is_current_user_ngo_staff_for_ngo(target_ngo_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ngo_staff ns
    where ns.ngo_id = target_ngo_id
      and ns.user_id = auth.uid()
  )
$$;

create or replace function public.is_current_user_listing_owner(listing_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.donation_listings d
    where d.id = listing_uuid
      and d.donor_id = auth.uid()
  )
$$;

create or replace function public.is_current_user_claim_participant_for_listing(listing_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.claims c
    where c.listing_id = listing_uuid
      and c.state in ('locked'::public.claim_status, 'completed'::public.claim_status)
      and (
        c.locked_by_user_id = auth.uid()
        or public.is_current_user_ngo_staff_for_ngo(c.ngo_id)
      )
  )
$$;

create or replace function public.can_current_user_access_claim(claim_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.claims c
      join public.donation_listings d on d.id = c.listing_id
      where c.id = claim_uuid
        and (
          c.locked_by_user_id = auth.uid()
          or d.donor_id = auth.uid()
          or public.is_current_user_ngo_staff_for_ngo(c.ngo_id)
        )
    )
$$;

create or replace function public.can_current_user_submit_feedback(
  listing_uuid uuid,
  claim_uuid uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.donation_listings d
      where d.id = listing_uuid
        and d.status = 'picked_up'::public.donation_status
        and d.donor_id = auth.uid()
    )
    or exists (
      select 1
      from public.claims c
      join public.donation_listings d on d.id = c.listing_id
      where d.id = listing_uuid
        and d.status = 'picked_up'::public.donation_status
        and (claim_uuid is null or c.id = claim_uuid)
        and public.is_current_user_ngo_staff_for_ngo(c.ngo_id)
    )
$$;

create or replace function public.can_current_user_access_listing(listing_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or public.is_current_user_listing_owner(listing_uuid)
    or public.is_current_user_claim_participant_for_listing(listing_uuid)
    or exists (
      with current_ngo as (
        select n.*
        from public.ngos n
        where n.id = public.current_verified_ngo_id()
      )
      select 1
      from public.donation_listings d
      join current_ngo n on true
      where d.id = listing_uuid
        and d.status = 'live'::public.donation_status
        and d.location is not null
        and n.location is not null
        and st_dwithin(d.location, n.location, n.service_radius_km * 1000)
        and (
          cardinality(n.accepted_categories) = 0
          or d.category = any(n.accepted_categories)
        )
        and public.pickup_window_availability_score(
          n.operating_hours,
          d.pickup_window_start,
          d.pickup_window_end
        ) > 0
        and public.ngo_capacity_score(n.id, d.pickup_window_start) > 0
    )
$$;

create or replace function public.can_current_user_view_exact_address(listing_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or public.is_current_user_listing_owner(listing_uuid)
    or public.is_current_user_claim_participant_for_listing(listing_uuid)
$$;

create or replace function public.can_current_user_chat_on_listing(listing_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.claims c
      where c.listing_id = listing_uuid
        and c.state in ('locked'::public.claim_status, 'completed'::public.claim_status)
        and public.is_current_user_listing_owner(listing_uuid)
    )
    or public.is_current_user_claim_participant_for_listing(listing_uuid)
$$;

create or replace function public.nearby_live_listings(
  max_radius_km double precision default null,
  filter_category text default null
)
returns table (
  id uuid,
  category text,
  quantity integer,
  quality public.item_quality,
  description text,
  locality text,
  city text,
  pincode text,
  pickup_window_start timestamptz,
  pickup_window_end timestamptz,
  distance_km double precision,
  match_score double precision,
  ngo_rating_average double precision,
  ngo_completion_rate double precision,
  status public.donation_status
)
language sql
stable
security definer
set search_path = public
as $$
  with current_ngo as (
    select
      n.id,
      n.location,
      n.service_radius_km,
      n.accepted_categories,
      n.operating_hours,
      n.rating_average,
      n.completion_rate
    from public.ngos n
    where n.id = public.current_verified_ngo_id()
  ),
  scored as (
    select
      d.id,
      d.category,
      d.quantity,
      d.quality,
      d.description,
      d.locality,
      d.city,
      d.pincode,
      d.pickup_window_start,
      d.pickup_window_end,
      st_distance(d.location, c.location) / 1000.0 as distance_km,
      greatest(
        0,
        1 - least(st_distance(d.location, c.location) / 1000.0, c.service_radius_km::double precision)
          / greatest(c.service_radius_km::double precision, 1)
      ) as distance_score,
      case
        when cardinality(c.accepted_categories) = 0 then 0.85
        when d.category = any(c.accepted_categories) then 1
        else 0
      end as category_score,
      public.pickup_window_availability_score(
        c.operating_hours,
        d.pickup_window_start,
        d.pickup_window_end
      ) as availability_score,
      public.ngo_capacity_score(c.id, d.pickup_window_start) as capacity_score,
      c.rating_average::double precision as ngo_rating_average,
      c.completion_rate::double precision as ngo_completion_rate,
      d.status
    from public.donation_listings d
    join current_ngo c on true
    where d.status = 'live'::public.donation_status
      and d.location is not null
      and c.location is not null
      and st_dwithin(
        d.location,
        c.location,
        coalesce(max_radius_km, c.service_radius_km) * 1000
      )
      and (filter_category is null or d.category = filter_category)
      and (
        cardinality(c.accepted_categories) = 0
        or d.category = any(c.accepted_categories)
      )
  )
  select
    scored.id,
    scored.category,
    scored.quantity,
    scored.quality,
    scored.description,
    scored.locality,
    scored.city,
    scored.pincode,
    scored.pickup_window_start,
    scored.pickup_window_end,
    scored.distance_km,
    round(
      (
        (
          scored.distance_score * 0.35 +
          scored.category_score * 0.20 +
          scored.availability_score * 0.15 +
          scored.capacity_score * 0.10 +
          scored.ngo_completion_rate * 0.10 +
          least(scored.ngo_rating_average / 5.0, 1) * 0.10
        ) * 100
      )::numeric,
      2
    )::double precision as match_score,
    scored.ngo_rating_average,
    scored.ngo_completion_rate,
    scored.status
  from scored
  where scored.availability_score > 0
    and scored.capacity_score > 0
  order by match_score desc, scored.distance_km asc, scored.pickup_window_start asc
$$;

drop function if exists public.listing_detail_for_current_user(uuid);

create or replace function public.listing_detail_for_current_user(listing_uuid uuid)
returns table (
  id uuid,
  category text,
  quantity integer,
  quality public.item_quality,
  description text,
  status public.donation_status,
  locality text,
  city text,
  pincode text,
  landmark text,
  exact_address text,
  latitude double precision,
  longitude double precision,
  pickup_window_start timestamptz,
  pickup_window_end timestamptz,
  distance_km double precision,
  match_score double precision,
  ngo_rating_average double precision,
  ngo_completion_rate double precision,
  donor_full_name text,
  donor_phone text,
  address_visible boolean,
  current_claim_id uuid,
  current_claim_state public.claim_status,
  current_ngo_name text
)
language sql
stable
security definer
set search_path = public
as $$
  with current_ngo as (
    select
      n.id,
      n.name,
      n.location,
      n.service_radius_km,
      n.accepted_categories,
      n.operating_hours,
      n.rating_average,
      n.completion_rate
    from public.ngos n
    where n.id = public.current_verified_ngo_id()
  ),
  current_claim as (
    select c.id, c.state, c.ngo_id
    from public.claims c
    join public.ngo_staff ns on ns.ngo_id = c.ngo_id
    where ns.user_id = auth.uid()
      and c.listing_id = listing_uuid
    order by c.locked_at desc
    limit 1
  )
  select
    d.id,
    d.category,
    d.quantity,
    d.quality,
    d.description,
    d.status,
    d.locality,
    d.city,
    d.pincode,
    d.landmark,
    case
      when public.can_current_user_view_exact_address(d.id) then d.address_line1
      else null
    end as exact_address,
    d.latitude,
    d.longitude,
    d.pickup_window_start,
    d.pickup_window_end,
    case
      when d.location is not null and current_ngo.location is not null then st_distance(d.location, current_ngo.location) / 1000.0
      else null
    end as distance_km,
    case
      when current_ngo.id is null or d.location is null or current_ngo.location is null then null
      else round(
        (
          (
            greatest(
              0,
              1 - least(st_distance(d.location, current_ngo.location) / 1000.0, current_ngo.service_radius_km::double precision)
                / greatest(current_ngo.service_radius_km::double precision, 1)
            ) * 0.35 +
            case
              when cardinality(current_ngo.accepted_categories) = 0 then 0.85
              when d.category = any(current_ngo.accepted_categories) then 1
              else 0
            end * 0.20 +
            public.pickup_window_availability_score(
              current_ngo.operating_hours,
              d.pickup_window_start,
              d.pickup_window_end
            ) * 0.15 +
            public.ngo_capacity_score(current_ngo.id, d.pickup_window_start) * 0.10 +
            current_ngo.completion_rate::double precision * 0.10 +
            least(current_ngo.rating_average::double precision / 5.0, 1) * 0.10
          ) * 100
        )::numeric,
        2
      )::double precision
    end as match_score,
    current_ngo.rating_average::double precision as ngo_rating_average,
    current_ngo.completion_rate::double precision as ngo_completion_rate,
    case
      when public.can_current_user_chat_on_listing(d.id) then donor_profile.full_name
      else null
    end as donor_full_name,
    case
      when public.can_current_user_chat_on_listing(d.id) then donor_profile.phone
      else null
    end as donor_phone,
    public.can_current_user_view_exact_address(d.id) as address_visible,
    current_claim.id as current_claim_id,
    current_claim.state as current_claim_state,
    current_ngo.name as current_ngo_name
  from public.donation_listings d
  left join public.profiles donor_profile on donor_profile.id = d.donor_id
  left join current_ngo on true
  left join current_claim on true
  where d.id = listing_uuid
    and public.can_current_user_access_listing(d.id)
$$;

create or replace function public.lock_listing(listing_uuid uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  active_ngo_id uuid;
  active_ngo_row public.ngos%rowtype;
  listing_row public.donation_listings%rowtype;
  new_claim_id uuid;
begin
  active_ngo_id := public.current_verified_ngo_id();

  if active_ngo_id is null then
    raise exception 'Only verified NGO staff can lock live listings.';
  end if;

  select *
  into active_ngo_row
  from public.ngos
  where id = active_ngo_id;

  select *
  into listing_row
  from public.donation_listings
  where id = listing_uuid
  for update;

  if not found then
    raise exception 'Listing not found.';
  end if;

  if listing_row.status <> 'live'::public.donation_status then
    raise exception 'Listing is no longer available.';
  end if;

  if listing_row.donor_id = auth.uid() then
    raise exception 'You cannot lock your own donation.';
  end if;

  if not exists (
    select 1
    from public.ngos n
    where n.id = active_ngo_id
      and n.location is not null
      and listing_row.location is not null
      and st_dwithin(listing_row.location, n.location, n.service_radius_km * 1000)
  ) then
    raise exception 'Listing is outside the NGO service radius.';
  end if;

  if cardinality(active_ngo_row.accepted_categories) > 0
    and not listing_row.category = any(active_ngo_row.accepted_categories) then
    raise exception 'Listing category is outside this NGO''s accepted categories.';
  end if;

  if public.pickup_window_availability_score(
    active_ngo_row.operating_hours,
    listing_row.pickup_window_start,
    listing_row.pickup_window_end
  ) <= 0 then
    raise exception 'Listing pickup window is outside the NGO operating hours.';
  end if;

  if public.ngo_capacity_score(active_ngo_id, listing_row.pickup_window_start) <= 0 then
    raise exception 'NGO has reached pickup capacity for that day.';
  end if;

  insert into public.claims (listing_id, ngo_id, locked_by_user_id, state)
  values (listing_uuid, active_ngo_id, auth.uid(), 'locked')
  returning id into new_claim_id;

  update public.donation_listings
  set status = 'locked'::public.donation_status
  where id = listing_uuid;

  insert into public.pickup_tasks (listing_id, claim_id, scheduled_start, scheduled_end, status)
  values (
    listing_uuid,
    new_claim_id,
    listing_row.pickup_window_start,
    listing_row.pickup_window_end,
    'scheduled'
  )
  on conflict (claim_id) do nothing;

  perform public.log_audit_event(
    'listing_locked',
    'donation_listing',
    listing_uuid,
    jsonb_build_object(
      'claim_id', new_claim_id,
      'ngo_id', active_ngo_id
    )
  );

  perform public.queue_notification(
    listing_row.donor_id,
    'ngo_locked_listing',
    'NGO locked your donation',
    'A verified NGO has locked your listing. Exact pickup coordination is now active.',
    '/donor/listings/' || listing_uuid::text,
    'in_app',
    jsonb_build_object('claim_id', new_claim_id, 'ngo_id', active_ngo_id)
  );

  return new_claim_id;
end;
$$;

create or replace function public.complete_locked_claim(listing_uuid uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  active_ngo_id uuid;
  active_claim_id uuid;
begin
  active_ngo_id := public.current_verified_ngo_id();

  if active_ngo_id is null then
    raise exception 'Only verified NGO staff can complete pickups.';
  end if;

  select c.id
  into active_claim_id
  from public.claims c
  where c.listing_id = listing_uuid
    and c.ngo_id = active_ngo_id
    and c.state = 'locked'::public.claim_status
  order by c.locked_at desc
  limit 1
  for update;

  if active_claim_id is null then
    raise exception 'No locked claim found for this NGO.';
  end if;

  update public.claims
  set
    state = 'completed'::public.claim_status,
    completed_at = timezone('utc', now())
  where id = active_claim_id;

  update public.donation_listings
  set status = 'picked_up'::public.donation_status
  where id = listing_uuid;

  update public.pickup_tasks
  set status = 'completed'
  where claim_id = active_claim_id;

  perform public.log_audit_event(
    'pickup_completed',
    'donation_listing',
    listing_uuid,
    jsonb_build_object(
      'claim_id', active_claim_id,
      'ngo_id', active_ngo_id
    )
  );

  perform public.queue_notification(
    (
      select donor_id
      from public.donation_listings
      where id = listing_uuid
    ),
    'pickup_completed',
    'Pickup completed',
    'Your donation was marked as picked up. You can now leave feedback.',
    '/donor/listings/' || listing_uuid::text,
    'in_app',
    jsonb_build_object('claim_id', active_claim_id, 'ngo_id', active_ngo_id)
  );

  return active_claim_id;
end;
$$;

create or replace function public.send_chat_message(
  listing_uuid uuid,
  message_body text,
  share_phone boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  listing_row public.donation_listings%rowtype;
  active_claim public.claims%rowtype;
  sender_role public.app_role;
  normalized_message text;
  shared_contact_phone text;
  recipient_user_id uuid;
  new_message_id uuid;
begin
  sender_role := public.current_app_role();
  normalized_message := btrim(coalesce(message_body, ''));

  if sender_role is null or sender_role not in ('donor'::public.app_role, 'ngo'::public.app_role) then
    raise exception 'Only donors and NGO staff can chat on listings.';
  end if;

  if normalized_message = '' then
    raise exception 'Message cannot be empty.';
  end if;

  select *
  into listing_row
  from public.donation_listings
  where id = listing_uuid;

  if not found then
    raise exception 'Listing not found.';
  end if;

  select *
  into active_claim
  from public.claims c
  where c.listing_id = listing_uuid
    and c.state in ('locked'::public.claim_status, 'completed'::public.claim_status)
  order by
    case when c.state = 'locked'::public.claim_status then 0 else 1 end,
    c.locked_at desc
  limit 1;

  if not found then
    raise exception 'Chat unlocks only after an NGO locks the donation.';
  end if;

  if sender_role = 'donor'::public.app_role then
    if listing_row.donor_id <> auth.uid() then
      raise exception 'Only the donor can send messages for this listing.';
    end if;

    recipient_user_id := active_claim.locked_by_user_id;

    if share_phone then
      select p.phone
      into shared_contact_phone
      from public.profiles p
      where p.id = auth.uid();
    end if;
  else
    if not exists (
      select 1
      from public.ngo_staff ns
      where ns.ngo_id = active_claim.ngo_id
        and ns.user_id = auth.uid()
    ) then
      raise exception 'Only the claiming NGO can chat on this listing.';
    end if;

    recipient_user_id := listing_row.donor_id;

    if share_phone then
      select n.contact_phone
      into shared_contact_phone
      from public.ngos n
      where n.id = active_claim.ngo_id;
    end if;
  end if;

  insert into public.chat_messages (
    listing_id,
    claim_id,
    sender_id,
    sender_role,
    message,
    shared_phone
  )
  values (
    listing_uuid,
    active_claim.id,
    auth.uid(),
    sender_role,
    normalized_message,
    nullif(shared_contact_phone, '')
  )
  returning id into new_message_id;

  perform public.log_audit_event(
    'chat_message_sent',
    'donation_listing',
    listing_uuid,
    jsonb_build_object(
      'claim_id', active_claim.id,
      'sender_role', sender_role,
      'shared_phone', shared_contact_phone is not null
    )
  );

  if recipient_user_id is not null and recipient_user_id <> auth.uid() then
    perform public.queue_notification(
      recipient_user_id,
      'listing_chat_message',
      'New coordination message',
      case
        when sender_role = 'donor'::public.app_role then 'The donor sent a new message on the locked listing.'
        else 'The NGO sent a new message on your locked listing.'
      end,
      case
        when sender_role = 'donor'::public.app_role then '/ngo/listings/' || listing_uuid::text
        else '/donor/listings/' || listing_uuid::text
      end,
      'in_app',
      jsonb_build_object('claim_id', active_claim.id, 'message_id', new_message_id)
    );
  end if;

  return new_message_id;
end;
$$;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.chat_messages;
    exception
      when duplicate_object then
        null;
    end;
  end if;
end
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'donation-images',
  'donation-images',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
