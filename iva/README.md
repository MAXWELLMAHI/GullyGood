# IVA Phase 1 MVP

IVA is a Mumbai-first hyperlocal donation web app connecting donors with verified NGOs.

Stack:

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Supabase Auth, Postgres, Storage
- PostGIS-ready matching with row-level security

## Phase 1 modules

- Donor app: register/login, create donation listing, upload image, track status, leave feedback
- NGO dashboard: view nearby live listings, lock a donation, complete pickup, leave feedback
- Admin panel: add NGOs manually, verify NGO details, view users/listings/claims
- Matching system: filter by radius, category, and pickup availability

## Project structure

```text
iva/
  app/
  components/
  database/
  lib/
  types/
  proxy.ts
```

## Local setup

1. Install dependencies.

```bash
npm install
```

2. Create a Supabase project.

3. Copy `.env.example` to `.env.local` and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. In Supabase SQL editor, run the files in this order:

```text
database/schema.sql
database/rls.sql
database/seed.sql
```

5. Start the app.

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000).

If Supabase env vars are missing, the UI still renders with realistic preview data so the app can be reviewed before wiring the backend.

## Seed accounts

After running `database/seed.sql`, you can use:

- `donor@iva.app` / `Password123!`
- `ngo@iva.app` / `Password123!`
- `admin@iva.app` / `Password123!`

## Database notes

- `profiles` is connected to `auth.users` via a trigger that creates the profile row on signup.
- `ngos` and `donation_listings` store `latitude`, `longitude`, and a PostGIS `location` geography point.
- `nearby_live_listings()` powers NGO matching using NGO service radius and donor location.
- `listing_detail_for_current_user()` hides the donor exact address until a verified NGO locks the listing.
- `lock_listing()` and `complete_locked_claim()` keep claim transitions atomic.
- Storage bucket: `donation-images`

## Route overview

- `/` landing page
- `/login`
- `/donor/dashboard`
- `/donor/donate`
- `/donor/listings/[id]`
- `/ngo/dashboard`
- `/ngo/listings/[id]`
- `/admin/dashboard`
- `/admin/ngos`
- `/admin/listings`

## Deployment

### Vercel

1. Import the repo in Vercel.
2. Set the same public Supabase env vars in the Vercel project.
3. Deploy the Next.js app.

### Supabase

1. Keep Auth email/password enabled.
2. Run the SQL files against the target project.
3. Confirm the `donation-images` bucket exists and remains private.

## What is implemented in this repo

- Mobile-first landing, auth, donor, NGO, and admin pages
- Reusable UI primitives and dashboard shells
- Supabase SSR auth client setup
- Role-aware route protection
- SQL schema, RLS, storage policies, and seed data
- First donation loop actions:
  donor create listing -> NGO lock -> NGO complete pickup -> both sides leave feedback
