# GullyGood Phase 1 MVP

GullyGood is a Mumbai-first hyperlocal donation app built around one job: help donors move useful items to verified NGOs with as little friction and ambiguity as possible.

Stack:

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Supabase Auth, Postgres, Storage
- PostGIS geography matching
- Supabase RLS and private storage access

## What is in this repo

- Donor flow: create a listing, upload an image, track status, leave feedback
- NGO flow: view nearby live listings, inspect match quality, lock a listing, complete pickup
- Admin flow: add NGOs manually, verify them, review users and listings
- SQL contract for schema, RLS, seed data, audit logs, and notifications
- Supabase CLI migration structure
- GitHub Actions CI for lint, typecheck, and build

## Product and auth note

The current local/dev scaffold uses email + password so seeded accounts are easy to run on a fresh Supabase project.

The intended production direction from the IVA UX brief is:

- one unified login
- role-based redirect after auth
- phone OTP for donor/NGO onboarding
- admin access kept invite-only

That OTP flow is documented as the next auth upgrade, but not faked in this repo.

## Local setup

1. Install dependencies.

```bash
npm install
```

2. Copy `.env.example` to `.env.local`.

```bash
cp .env.example .env.local
```

3. Add your Supabase public values.

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. Apply the database in one of two ways.

Option A: SQL editor

```text
database/schema.sql
database/rls.sql
database/seed.sql
```

Option B: Supabase CLI

```bash
supabase db push
supabase db reset
```

The CLI source of truth lives in:

- `supabase/migrations/202604270001_initial_phase1.sql`
- `supabase/seed.sql`

5. Start the app.

```bash
npm run dev
```

6. Open [http://localhost:3001](http://localhost:3001).

If Supabase env vars are missing, the UI still renders in preview mode with mock data so the flows can be reviewed.

## Useful scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Seed accounts

After running `database/seed.sql` or `supabase/seed.sql`:

- `donor@iva.app` / `Password123!`
- `ngo@iva.app` / `Password123!`
- `admin@iva.app` / `Password123!`

## Matching architecture

Phase 1 uses PostGIS nearest-neighbor matching, not route optimization.

Core location model:

- `donation_listings.location` is `geography(Point, 4326)`
- `ngos.location` is `geography(Point, 4326)`

The NGO discovery RPC is `nearby_live_listings()`. It filters to verified NGOs and ranks matches with:

- distance score
- accepted category match
- NGO operating-hours overlap
- daily pickup capacity availability
- NGO completion rate
- NGO rating average

The current weighted score is:

```text
35% distance
20% accepted category
15% operating-hours fit
10% pickup capacity
10% completion rate
10% rating average
```

This keeps Phase 1 focused on “best nearby NGO for this listing,” not route planning.

Later phases:

- Phase 2: route batching with Google Routes API / OSRM / OR-Tools
- Phase 3: advanced path optimization only if IVA owns pickup routing

## Claim lock and privacy model

- Listings become visible to eligible NGOs through the matching RPC.
- Exact donor address stays hidden until a successful lock.
- `lock_listing()` runs as a transactional server-side function and works with the partial unique index on active claims so only one NGO can hold a live listing.
- `complete_locked_claim()` closes the loop, updates pickup state, queues notifications, and writes audit events.

## Security baseline

Implemented now:

- role-aware access for donor, NGO, and admin
- RLS on all Phase 1 tables
- private `donation-images` bucket
- storage MIME and size restrictions
- exact-address privacy enforced in SQL, not just UI
- donor listing/image updates blocked once a listing is locked
- audit log RPC for important actions
- notifications table structured to act as a delivery queue

Planned/expected next controls:

- phone OTP rate limiting
- listing creation throttling
- image upload quotas
- dispute and abuse workflow
- scheduled notification fan-out by radius stage

## CI/CD

GitHub Actions workflow:

- file: `.github/workflows/iva-ci.yml`
- runs on push and pull request to `main` and `staging`
- executes:
  - `npm ci`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`

Recommended branch model:

- `main` for production
- `staging` for QA deployment
- `dev` for active integration
- `feature/*` for isolated work

Recommended deployment path:

- GitHub PR -> CI -> Vercel preview
- merge to `staging` -> staging deploy
- merge to `main` -> production deploy

## Deployment

### Frontend

Deploy the app directory to Vercel:

- framework: Next.js
- root directory: `iva` if your git repo root is one level above this app
- set the same public Supabase env vars in Vercel

### Backend

For Phase 1, Next.js server actions/API + Supabase are enough. No separate backend service is required yet.

## Main directories

```text
iva/
  app/
  components/
  database/
  lib/
  supabase/
    migrations/
    seed.sql
  types/
  proxy.ts
```
