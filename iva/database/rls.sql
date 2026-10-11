-- IVA Phase 1 MVP row level security
-- Run this file after schema.sql.

alter table public.profiles enable row level security;
alter table public.ngos enable row level security;
alter table public.ngo_staff enable row level security;
alter table public.donation_listings enable row level security;
alter table public.donation_images enable row level security;
alter table public.claims enable row level security;
alter table public.pickup_tasks enable row level security;
alter table public.feedback enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_insert_self_or_admin on public.profiles;
create policy profiles_insert_self_or_admin
on public.profiles
for insert
to authenticated
with check (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

drop policy if exists ngos_select_verified_or_related on public.ngos;
create policy ngos_select_verified_or_related
on public.ngos
for select
to authenticated
using (
  public.is_admin()
  or verified_status = 'verified'::public.ngo_verification_status
  or exists (
    select 1
    from public.ngo_staff ns
    where ns.ngo_id = ngos.id
      and ns.user_id = auth.uid()
  )
);

drop policy if exists ngos_admin_insert on public.ngos;
create policy ngos_admin_insert
on public.ngos
for insert
to authenticated
with check (public.is_admin());

drop policy if exists ngos_admin_update on public.ngos;
create policy ngos_admin_update
on public.ngos
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists ngo_staff_select_self_or_admin on public.ngo_staff;
create policy ngo_staff_select_self_or_admin
on public.ngo_staff
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists ngo_staff_admin_insert on public.ngo_staff;
create policy ngo_staff_admin_insert
on public.ngo_staff
for insert
to authenticated
with check (public.is_admin());

drop policy if exists ngo_staff_admin_update on public.ngo_staff;
create policy ngo_staff_admin_update
on public.ngo_staff
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

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

drop policy if exists donation_listings_insert_owner_only on public.donation_listings;
create policy donation_listings_insert_owner_only
on public.donation_listings
for insert
to authenticated
with check (
  donor_id = auth.uid()
  and public.current_app_role() = 'donor'::public.app_role
);

drop policy if exists donation_listings_update_owner_or_admin on public.donation_listings;
create policy donation_listings_update_owner_or_admin
on public.donation_listings
for update
to authenticated
using (
  public.is_admin()
  or (
    donor_id = auth.uid()
    and status in ('submitted'::public.donation_status, 'live'::public.donation_status)
  )
)
with check (
  public.is_admin()
  or (
    donor_id = auth.uid()
    and status in (
      'submitted'::public.donation_status,
      'live'::public.donation_status,
      'cancelled'::public.donation_status,
      'expired'::public.donation_status
    )
  )
);

drop policy if exists donation_images_select_accessible_listing on public.donation_images;
create policy donation_images_select_accessible_listing
on public.donation_images
for select
to authenticated
using (public.can_current_user_access_listing(listing_id));

drop policy if exists donation_images_insert_owner_or_admin on public.donation_images;
create policy donation_images_insert_owner_or_admin
on public.donation_images
for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.donation_listings d
    where d.id = donation_images.listing_id
      and d.donor_id = auth.uid()
      and d.status in ('submitted'::public.donation_status, 'live'::public.donation_status)
  )
);

drop policy if exists donation_images_update_owner_or_admin on public.donation_images;
create policy donation_images_update_owner_or_admin
on public.donation_images
for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.donation_listings d
    where d.id = donation_images.listing_id
      and d.donor_id = auth.uid()
      and d.status in ('submitted'::public.donation_status, 'live'::public.donation_status)
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.donation_listings d
    where d.id = donation_images.listing_id
      and d.donor_id = auth.uid()
      and d.status in ('submitted'::public.donation_status, 'live'::public.donation_status)
    )
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

drop policy if exists claims_admin_update on public.claims;
create policy claims_admin_update
on public.claims
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

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

drop policy if exists feedback_update_author_only on public.feedback;
create policy feedback_update_author_only
on public.feedback
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_admin_select
on public.audit_logs
for select
to authenticated
using (public.is_admin());

drop policy if exists audit_logs_admin_insert on public.audit_logs;
create policy audit_logs_admin_insert
on public.audit_logs
for insert
to authenticated
with check (public.is_admin());

drop policy if exists notifications_select_owner_or_admin on public.notifications;
create policy notifications_select_owner_or_admin
on public.notifications
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_update_owner_or_admin on public.notifications;
create policy notifications_update_owner_or_admin
on public.notifications
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists chat_messages_select_participants_or_admin on public.chat_messages;
create policy chat_messages_select_participants_or_admin
on public.chat_messages
for select
to authenticated
using (public.can_current_user_chat_on_listing(listing_id));

drop policy if exists chat_messages_insert_participants_only on public.chat_messages;
create policy chat_messages_insert_participants_only
on public.chat_messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and sender_role = public.current_app_role()
  and sender_role in ('donor'::public.app_role, 'ngo'::public.app_role)
  and public.can_current_user_chat_on_listing(listing_id)
  and exists (
    select 1
    from public.claims c
    where c.id = chat_messages.claim_id
      and c.listing_id = chat_messages.listing_id
      and c.state in ('locked'::public.claim_status, 'completed'::public.claim_status)
  )
);

drop policy if exists storage_donation_images_select on storage.objects;
create policy storage_donation_images_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'donation-images'
  and public.can_current_user_access_listing(split_part(name, '/', 1)::uuid)
);

drop policy if exists storage_donation_images_insert on storage.objects;
create policy storage_donation_images_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'donation-images'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.donation_listings d
      where d.id = split_part(name, '/', 1)::uuid
        and d.donor_id = auth.uid()
        and d.status in ('submitted'::public.donation_status, 'live'::public.donation_status)
    )
  )
);

drop policy if exists storage_donation_images_update on storage.objects;
create policy storage_donation_images_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'donation-images'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.donation_listings d
      where d.id = split_part(name, '/', 1)::uuid
        and d.donor_id = auth.uid()
        and d.status in ('submitted'::public.donation_status, 'live'::public.donation_status)
    )
  )
)
with check (
  bucket_id = 'donation-images'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.donation_listings d
      where d.id = split_part(name, '/', 1)::uuid
        and d.donor_id = auth.uid()
        and d.status in ('submitted'::public.donation_status, 'live'::public.donation_status)
    )
  )
);

drop policy if exists storage_donation_images_delete on storage.objects;
create policy storage_donation_images_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'donation-images'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.donation_listings d
      where d.id = split_part(name, '/', 1)::uuid
        and d.donor_id = auth.uid()
        and d.status in ('submitted'::public.donation_status, 'live'::public.donation_status)
    )
  )
);

grant execute on function public.nearby_live_listings(double precision, text) to authenticated;
grant execute on function public.listing_detail_for_current_user(uuid) to authenticated;
grant execute on function public.lock_listing(uuid) to authenticated;
grant execute on function public.complete_locked_claim(uuid) to authenticated;
grant execute on function public.send_chat_message(uuid, text, boolean) to authenticated;
grant execute on function public.sync_profile_from_auth_user(uuid) to authenticated;
grant execute on function public.log_audit_event(text, text, uuid, jsonb) to authenticated;
grant execute on function public.queue_notification(uuid, text, text, text, text, text, jsonb, timestamptz) to authenticated;
