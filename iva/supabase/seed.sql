-- IVA Phase 1 MVP seed data
-- Run this file after schema.sql and rls.sql.

do $$
declare
  donor_user_id uuid := '11111111-1111-1111-1111-111111111111';
  ngo_user_id uuid := '22222222-2222-2222-2222-222222222222';
  admin_user_id uuid := '33333333-3333-3333-3333-333333333333';
  sahaara_ngo_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  aman_ngo_id uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  live_listing_id uuid := '44444444-4444-4444-4444-444444444444';
  locked_listing_id uuid := '55555555-5555-5555-5555-555555555555';
  completed_listing_id uuid := '66666666-6666-6666-6666-666666666666';
  locked_claim_id uuid := '77777777-7777-7777-7777-777777777777';
  completed_claim_id uuid := '88888888-8888-8888-8888-888888888888';
  locked_chat_message_1_id uuid := '99999999-9999-9999-9999-999999999991';
  locked_chat_message_2_id uuid := '99999999-9999-9999-9999-999999999992';
  completed_chat_message_1_id uuid := '99999999-9999-9999-9999-999999999993';
  identities_id_is_uuid boolean := false;
  identities_has_provider_id boolean := false;
begin
  donor_user_id := coalesce(
    (select id from auth.users where email = 'donor@iva.app' limit 1),
    donor_user_id
  );
  ngo_user_id := coalesce(
    (select id from auth.users where email = 'ngo@iva.app' limit 1),
    ngo_user_id
  );
  admin_user_id := coalesce(
    (select id from auth.users where email = 'admin@iva.app' limit 1),
    admin_user_id
  );

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values
    (
      donor_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'donor@iva.app',
      crypt('Password123!', gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Asha Mehta","role":"donor"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now()),
      '',
      '',
      '',
      ''
    ),
    (
      ngo_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'ngo@iva.app',
      crypt('Password123!', gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Rohan Patil","role":"ngo"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now()),
      '',
      '',
      '',
      ''
    ),
    (
      admin_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@iva.app',
      crypt('Password123!', gen_salt('bf')),
      timezone('utc', now()),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"IVA Ops","role":"admin"}'::jsonb,
      timezone('utc', now()),
      timezone('utc', now()),
      '',
      '',
      '',
      ''
    )
  on conflict (id) do nothing;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'auth'
      and table_name = 'identities'
      and column_name = 'provider_id'
  )
  into identities_has_provider_id;

  select coalesce(data_type = 'uuid', false)
  into identities_id_is_uuid
  from information_schema.columns
  where table_schema = 'auth'
    and table_name = 'identities'
    and column_name = 'id';

  if identities_has_provider_id then
    if identities_id_is_uuid then
      insert into auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        created_at,
        updated_at,
        last_sign_in_at
      )
      select
        seeded.id,
        seeded.user_id,
        seeded.identity_data,
        seeded.provider,
        seeded.provider_id,
        seeded.created_at,
        seeded.updated_at,
        seeded.last_sign_in_at
      from (
        values
          (
            donor_user_id,
            donor_user_id,
            jsonb_build_object('sub', donor_user_id::text, 'email', 'donor@iva.app', 'email_verified', true),
            'email',
            donor_user_id::text,
            timezone('utc', now()),
            timezone('utc', now()),
            timezone('utc', now())
          ),
          (
            ngo_user_id,
            ngo_user_id,
            jsonb_build_object('sub', ngo_user_id::text, 'email', 'ngo@iva.app', 'email_verified', true),
            'email',
            ngo_user_id::text,
            timezone('utc', now()),
            timezone('utc', now()),
            timezone('utc', now())
          ),
          (
            admin_user_id,
            admin_user_id,
            jsonb_build_object('sub', admin_user_id::text, 'email', 'admin@iva.app', 'email_verified', true),
            'email',
            admin_user_id::text,
            timezone('utc', now()),
            timezone('utc', now()),
            timezone('utc', now())
          )
      ) as seeded(
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        created_at,
        updated_at,
        last_sign_in_at
      )
      where not exists (
        select 1
        from auth.identities existing
        where existing.user_id = seeded.user_id
          and existing.provider = seeded.provider
      );
    else
      insert into auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        created_at,
        updated_at,
        last_sign_in_at
      )
      select
        seeded.id::text,
        seeded.user_id,
        seeded.identity_data,
        seeded.provider,
        seeded.provider_id,
        seeded.created_at,
        seeded.updated_at,
        seeded.last_sign_in_at
      from (
        values
          (
            donor_user_id,
            donor_user_id,
            jsonb_build_object('sub', donor_user_id::text, 'email', 'donor@iva.app', 'email_verified', true),
            'email',
            donor_user_id::text,
            timezone('utc', now()),
            timezone('utc', now()),
            timezone('utc', now())
          ),
          (
            ngo_user_id,
            ngo_user_id,
            jsonb_build_object('sub', ngo_user_id::text, 'email', 'ngo@iva.app', 'email_verified', true),
            'email',
            ngo_user_id::text,
            timezone('utc', now()),
            timezone('utc', now()),
            timezone('utc', now())
          ),
          (
            admin_user_id,
            admin_user_id,
            jsonb_build_object('sub', admin_user_id::text, 'email', 'admin@iva.app', 'email_verified', true),
            'email',
            admin_user_id::text,
            timezone('utc', now()),
            timezone('utc', now()),
            timezone('utc', now())
          )
      ) as seeded(
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        created_at,
        updated_at,
        last_sign_in_at
      )
      where not exists (
        select 1
        from auth.identities existing
        where existing.user_id = seeded.user_id
          and existing.provider = seeded.provider
      );
    end if;
  else
    if identities_id_is_uuid then
      insert into auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        created_at,
        updated_at,
        last_sign_in_at
      )
      select
        seeded.id,
        seeded.user_id,
        seeded.identity_data,
        seeded.provider,
        seeded.created_at,
        seeded.updated_at,
        seeded.last_sign_in_at
      from (
        values
          (
            donor_user_id,
            donor_user_id,
            jsonb_build_object('sub', donor_user_id::text, 'email', 'donor@iva.app', 'email_verified', true),
            'email',
            timezone('utc', now()),
            timezone('utc', now()),
            timezone('utc', now())
          ),
          (
            ngo_user_id,
            ngo_user_id,
            jsonb_build_object('sub', ngo_user_id::text, 'email', 'ngo@iva.app', 'email_verified', true),
            'email',
            timezone('utc', now()),
            timezone('utc', now()),
            timezone('utc', now())
          ),
          (
            admin_user_id,
            admin_user_id,
            jsonb_build_object('sub', admin_user_id::text, 'email', 'admin@iva.app', 'email_verified', true),
            'email',
            timezone('utc', now()),
            timezone('utc', now()),
            timezone('utc', now())
          )
      ) as seeded(
        id,
        user_id,
        identity_data,
        provider,
        created_at,
        updated_at,
        last_sign_in_at
      )
      where not exists (
        select 1
        from auth.identities existing
        where existing.user_id = seeded.user_id
          and existing.provider = seeded.provider
      );
    else
      insert into auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        created_at,
        updated_at,
        last_sign_in_at
      )
      select
        seeded.id::text,
        seeded.user_id,
        seeded.identity_data,
        seeded.provider,
        seeded.created_at,
        seeded.updated_at,
        seeded.last_sign_in_at
      from (
        values
          (
            donor_user_id,
            donor_user_id,
            jsonb_build_object('sub', donor_user_id::text, 'email', 'donor@iva.app', 'email_verified', true),
            'email',
            timezone('utc', now()),
            timezone('utc', now()),
            timezone('utc', now())
          ),
          (
            ngo_user_id,
            ngo_user_id,
            jsonb_build_object('sub', ngo_user_id::text, 'email', 'ngo@iva.app', 'email_verified', true),
            'email',
            timezone('utc', now()),
            timezone('utc', now()),
            timezone('utc', now())
          ),
          (
            admin_user_id,
            admin_user_id,
            jsonb_build_object('sub', admin_user_id::text, 'email', 'admin@iva.app', 'email_verified', true),
            'email',
            timezone('utc', now()),
            timezone('utc', now()),
            timezone('utc', now())
          )
      ) as seeded(
        id,
        user_id,
        identity_data,
        provider,
        created_at,
        updated_at,
        last_sign_in_at
      )
      where not exists (
        select 1
        from auth.identities existing
        where existing.user_id = seeded.user_id
          and existing.provider = seeded.provider
      );
    end if;
  end if;

  perform public.sync_profile_from_auth_user(donor_user_id);
  perform public.sync_profile_from_auth_user(ngo_user_id);
  perform public.sync_profile_from_auth_user(admin_user_id);

  update public.profiles
  set
    role = case id
      when donor_user_id then 'donor'::public.app_role
      when ngo_user_id then 'ngo'::public.app_role
      when admin_user_id then 'admin'::public.app_role
      else role
    end,
    full_name = case id
      when donor_user_id then coalesce(full_name, 'Asha Mehta')
      when ngo_user_id then coalesce(full_name, 'Rohan Patil')
      when admin_user_id then coalesce(full_name, 'IVA Ops')
      else full_name
    end,
    phone = case id
      when donor_user_id then '+91 90000 11111'
      when ngo_user_id then '+91 98765 43210'
      when admin_user_id then '+91 90000 33333'
      else phone
    end,
    city = 'Mumbai',
    pincode = case id
      when donor_user_id then '400016'
      when ngo_user_id then '400050'
      when admin_user_id then '400001'
      else pincode
    end
  where id in (donor_user_id, ngo_user_id, admin_user_id);

  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'full_name',
    case id
      when donor_user_id then 'Asha Mehta'
      when ngo_user_id then 'Rohan Patil'
      when admin_user_id then 'IVA Ops'
      else null
    end,
    'role',
    case id
      when donor_user_id then 'donor'
      when ngo_user_id then 'ngo'
      when admin_user_id then 'admin'
      else null
    end
  );
  where id in (donor_user_id, ngo_user_id, admin_user_id);

  insert into public.ngos (
    id,
    name,
    address,
    city,
    pincode,
    ngo_darpan_id,
    registration_number,
    contact_phone,
    service_radius_km,
    accepted_categories,
    daily_pickup_capacity,
    verified_status,
    latitude,
    longitude
  )
  values
    (
      sahaara_ngo_id,
      'Sahaara Community Trust',
      'Hill Road Outreach Centre',
      'Mumbai',
      '400050',
      'MH/2026/0001111',
      'MH-TRUST-48211',
      '+91 98765 43210',
      8,
      array['Blankets', 'Books', 'Clothes'],
      14,
      'verified',
      19.0551,
      72.8286
    ),
    (
      aman_ngo_id,
      'Aman Seva Foundation',
      'Parel Community Hub',
      'Mumbai',
      '400012',
      'MH/2026/0001112',
      'MH-SOC-48351',
      '+91 99887 66554',
      10,
      array['Packed Meals', 'Dry Rations'],
      20,
      'pending',
      19.0076,
      72.8429
    )
  on conflict (id) do nothing;

  insert into public.ngo_staff (ngo_id, user_id, staff_role, is_primary)
  values (sahaara_ngo_id, ngo_user_id, 'coordinator', true)
  on conflict (ngo_id, user_id) do nothing;

  insert into public.donation_listings (
    id,
    donor_id,
    category,
    quantity,
    quality,
    description,
    address_line1,
    landmark,
    locality,
    city,
    pincode,
    latitude,
    longitude,
    pickup_window_start,
    pickup_window_end,
    status
  )
  values
    (
      live_listing_id,
      donor_user_id,
      'Blankets',
      6,
      'good',
      'Freshly washed blankets ready for same-day pickup.',
      'Mahim Causeway Apartment 4B',
      'Near Mahim railway station',
      'Mahim',
      'Mumbai',
      '400016',
      19.0415,
      72.8397,
      timezone('utc', now()) + interval '5 hours',
      timezone('utc', now()) + interval '11 hours',
      'live'
    ),
    (
      locked_listing_id,
      donor_user_id,
      'Books',
      24,
      'excellent',
      'School books and workbooks grouped by class level.',
      'St. Martin Lane, Bandra West',
      'Behind Linking Road market',
      'Bandra West',
      'Mumbai',
      '400050',
      19.0548,
      72.8265,
      timezone('utc', now()) + interval '3 hours',
      timezone('utc', now()) + interval '9 hours',
      'locked'
    ),
    (
      completed_listing_id,
      donor_user_id,
      'Packed Meals',
      18,
      'new',
      'Freshly packed vegetarian meals from a society drive.',
      'Parel TT service road',
      'Near the flyover',
      'Dadar East',
      'Mumbai',
      '400014',
      19.0152,
      72.8451,
      timezone('utc', now()) - interval '1 day',
      timezone('utc', now()) - interval '20 hours',
      'picked_up'
    )
  on conflict (id) do nothing;

  insert into public.claims (
    id,
    listing_id,
    ngo_id,
    locked_by_user_id,
    state,
    locked_at
  )
  values
    (
      locked_claim_id,
      locked_listing_id,
      sahaara_ngo_id,
      ngo_user_id,
      'locked',
      timezone('utc', now()) - interval '1 hour'
    ),
    (
      completed_claim_id,
      completed_listing_id,
      sahaara_ngo_id,
      ngo_user_id,
      'completed',
      timezone('utc', now()) - interval '28 hours'
    )
  on conflict (id) do nothing;

  update public.claims
  set completed_at = timezone('utc', now()) - interval '20 hours'
  where id = completed_claim_id;

  insert into public.pickup_tasks (
    listing_id,
    claim_id,
    scheduled_start,
    scheduled_end,
    status
  )
  values
    (
      locked_listing_id,
      locked_claim_id,
      timezone('utc', now()) + interval '3 hours',
      timezone('utc', now()) + interval '9 hours',
      'scheduled'
    ),
    (
      completed_listing_id,
      completed_claim_id,
      timezone('utc', now()) - interval '1 day',
      timezone('utc', now()) - interval '20 hours',
      'completed'
    )
  on conflict (claim_id) do nothing;

  insert into public.feedback (
    listing_id,
    claim_id,
    author_id,
    target_role,
    rating,
    comments
  )
  values
    (
      completed_listing_id,
      completed_claim_id,
      ngo_user_id,
      'donor',
      5,
      'Pickup was smooth and the donor had everything packed well.'
    ),
    (
      completed_listing_id,
      completed_claim_id,
      donor_user_id,
      'ngo',
      5,
      'The volunteer arrived on time and coordinated clearly.'
    )
  on conflict (listing_id, author_id, target_role) do nothing;

  insert into public.chat_messages (
    id,
    listing_id,
    claim_id,
    sender_id,
    sender_role,
    message,
    shared_phone
  )
  values
    (
      locked_chat_message_1_id,
      locked_listing_id,
      locked_claim_id,
      ngo_user_id,
      'ngo',
      'Hi, we have locked this pickup. Our volunteer can arrive within your selected window.',
      '+91 98765 43210'
    ),
    (
      locked_chat_message_2_id,
      locked_listing_id,
      locked_claim_id,
      donor_user_id,
      'donor',
      'Perfect, the bags are packed near the entrance. Please call if you need the exact building gate.',
      '+91 90000 11111'
    ),
    (
      completed_chat_message_1_id,
      completed_listing_id,
      completed_claim_id,
      donor_user_id,
      'donor',
      'Thanks again for the smooth pickup yesterday.',
      null
    )
  on conflict (id) do nothing;
end
$$;
