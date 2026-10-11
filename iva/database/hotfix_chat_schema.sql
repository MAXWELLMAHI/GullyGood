-- IVA chat schema hotfix
-- Run this in Supabase SQL Editor if locked-listing chat shows as missing.

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

create index if not exists chat_messages_listing_created_at_idx on public.chat_messages (listing_id, created_at);
create index if not exists chat_messages_claim_idx on public.chat_messages (claim_id);
create index if not exists chat_messages_sender_idx on public.chat_messages (sender_id, created_at desc);

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

alter table public.chat_messages enable row level security;

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

grant select, insert on public.chat_messages to authenticated;
grant execute on function public.send_chat_message(uuid, text, boolean) to authenticated;
