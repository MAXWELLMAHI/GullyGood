-- IVA Phase 1 MVP schema
-- Run this file first in your Supabase SQL editor.

create extension if not exists postgis;
create extension if not exists pgcrypto;

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
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists ngos_verified_status_idx on public.ngos (verified_status);
create index if not exists ngos_city_idx on public.ngos (city);
create index if not exists donation_listings_status_idx on public.donation_listings (status);
create index if not exists donation_listings_category_idx on public.donation_listings (category);
create index if not exists donation_listings_pickup_window_idx on public.donation_listings (pickup_window_start, pickup_window_end);
create index if not exists donation_listings_location_gix on public.donation_listings using gist (location);
create index if not exists ngos_location_gix on public.ngos using gist (location);
create index if not exists claims_listing_idx on public.claims (listing_id);
create index if not exists claims_ngo_idx on public.claims (ngo_id);
create unique index if not exists claims_single_active_lock_idx on public.claims (listing_id) where state = 'locked';
create unique index if not exists donation_images_primary_per_listing_idx on public.donation_images (listing_id) where is_primary = true;
create index if not exists feedback_listing_idx on public.feedback (listing_id);

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.phone, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'donor')::public.app_role
  )
  on conflict (id) do update
  set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    role = coalesce(excluded.role, public.profiles.role),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

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

create or replace function public.can_current_user_access_listing(listing_uuid uuid)
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
      from public.donation_listings d
      where d.id = listing_uuid
        and d.donor_id = auth.uid()
    )
    or exists (
      select 1
      from public.claims c
      join public.ngo_staff ns on ns.ngo_id = c.ngo_id
      where c.listing_id = listing_uuid
        and ns.user_id = auth.uid()
        and c.state in ('locked'::public.claim_status, 'completed'::public.claim_status)
    )
    or exists (
      select 1
      from public.donation_listings d
      join public.ngos n on n.id = public.current_verified_ngo_id()
      where d.id = listing_uuid
        and d.status = 'live'::public.donation_status
        and d.location is not null
        and n.location is not null
        and st_dwithin(d.location, n.location, n.service_radius_km * 1000)
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
    or exists (
      select 1
      from public.donation_listings d
      where d.id = listing_uuid
        and d.donor_id = auth.uid()
    )
    or exists (
      select 1
      from public.claims c
      join public.ngo_staff ns on ns.ngo_id = c.ngo_id
      where c.listing_id = listing_uuid
        and ns.user_id = auth.uid()
        and c.state in ('locked'::public.claim_status, 'completed'::public.claim_status)
    )
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
  status public.donation_status
)
language sql
stable
security definer
set search_path = public
as $$
  with current_ngo as (
    select n.id, n.location, n.service_radius_km
    from public.ngos n
    where n.id = public.current_verified_ngo_id()
  )
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
  order by st_distance(d.location, c.location), d.pickup_window_start asc
$$;

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
    select n.id, n.name, n.location
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
    public.can_current_user_view_exact_address(d.id) as address_visible,
    current_claim.id as current_claim_id,
    current_claim.state as current_claim_state,
    current_ngo.name as current_ngo_name
  from public.donation_listings d
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
  listing_row public.donation_listings%rowtype;
  new_claim_id uuid;
begin
  active_ngo_id := public.current_verified_ngo_id();

  if active_ngo_id is null then
    raise exception 'Only verified NGO staff can lock live listings.';
  end if;

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

  return active_claim_id;
end;
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
