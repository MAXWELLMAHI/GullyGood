-- IVA hotfix: remove recursive RLS checks that break donation creation
-- Run this in Supabase SQL Editor if you see:
-- - infinite recursion detected in policy for relation "donation_listings"
-- - The database schema is invalid or incompatible.

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

drop policy if exists donation_listings_select_owner_admin_or_claimed on public.donation_listings;
create policy donation_listings_select_owner_admin_or_claimed
on public.donation_listings
for select
to authenticated
using (
  public.is_admin()
  or donor_id = auth.uid()
  or public.is_current_user_claim_participant_for_listing(id)
);

drop policy if exists claims_select_participants_or_admin on public.claims;
create policy claims_select_participants_or_admin
on public.claims
for select
to authenticated
using (
  public.is_admin()
  or public.can_current_user_access_claim(id)
);

drop policy if exists pickup_tasks_select_participants_or_admin on public.pickup_tasks;
create policy pickup_tasks_select_participants_or_admin
on public.pickup_tasks
for select
to authenticated
using (
  public.is_admin()
  or public.is_current_user_listing_owner(listing_id)
  or public.can_current_user_access_claim(claim_id)
);

drop policy if exists feedback_select_participants_or_admin on public.feedback;
create policy feedback_select_participants_or_admin
on public.feedback
for select
to authenticated
using (
  public.is_admin()
  or author_id = auth.uid()
  or public.is_current_user_listing_owner(listing_id)
  or (claim_id is not null and public.can_current_user_access_claim(claim_id))
);

drop policy if exists feedback_insert_participants_only on public.feedback;
create policy feedback_insert_participants_only
on public.feedback
for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.can_current_user_submit_feedback(listing_id, claim_id)
);
