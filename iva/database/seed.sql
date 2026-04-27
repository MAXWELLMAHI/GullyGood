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
begin
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

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    created_at,
    updated_at,
    last_sign_in_at
  )
  values
    (
      donor_user_id::text,
      donor_user_id,
      format('{"sub":"%s","email":"%s"}', donor_user_id, 'donor@iva.app')::jsonb,
      'email',
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    ),
    (
      ngo_user_id::text,
      ngo_user_id,
      format('{"sub":"%s","email":"%s"}', ngo_user_id, 'ngo@iva.app')::jsonb,
      'email',
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    ),
    (
      admin_user_id::text,
      admin_user_id,
      format('{"sub":"%s","email":"%s"}', admin_user_id, 'admin@iva.app')::jsonb,
      'email',
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    )
  on conflict (provider, id) do nothing;

  update public.profiles
  set
    city = 'Mumbai',
    pincode = case id
      when donor_user_id then '400016'
      when ngo_user_id then '400050'
      when admin_user_id then '400001'
      else pincode
    end
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
end
$$;
