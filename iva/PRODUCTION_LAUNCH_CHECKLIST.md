# GullyGood — Production Launch Checklist & Deployment Guide

This guide outlines every required step to move **GullyGood** from local development to a live, production market launch in Mumbai.

---

## 1. Environment Configuration

In your production deployment (e.g. Vercel, Netlify, or AWS), configure these environment variables:

| Variable | Required | Description | Production Example |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Your Supabase project URL | `https://your-ref.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anonymous public key | `sb_publishable_...` |
| `NEXT_PUBLIC_ENABLE_DEMO_MODE` | **Yes** | **Set to `false` for production** | `false` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Recommended | Google Places & Geocoding API key for reverse lookup | `AIzaSy...` |

> [!IMPORTANT]
> Setting `NEXT_PUBLIC_ENABLE_DEMO_MODE=false` automatically disables mock cookies, hides the seeded demo accounts card on the login screen, and forces genuine Supabase authentication for all donors, NGOs, and admins.

---

## 2. Supabase Database Setup

Run the SQL migration scripts in your **Supabase Dashboard → SQL Editor** in the following sequence:

1. [`database/schema.sql`](file:///c:/Users/golan/Desktop/eva/iva/database/schema.sql) — Core tables, enums, PostGIS geometry columns, and triggers.
2. [`database/fcfs_claim_schema.sql`](file:///c:/Users/golan/Desktop/eva/iva/database/fcfs_claim_schema.sql) — Concurrency-safe claim locking function to prevent race conditions when multiple NGOs view the same listing.
3. [`database/hotfix_chat_schema.sql`](file:///c:/Users/golan/Desktop/eva/iva/database/hotfix_chat_schema.sql) — Listing coordination chat messages schema and realtime publication.
4. [`database/hotfix_rls_recursion.sql`](file:///c:/Users/golan/Desktop/eva/iva/database/hotfix_rls_recursion.sql) — High-performance security definer functions preventing RLS recursion.

---

## 3. Supabase Storage Provisioning

In **Supabase Dashboard → Storage**:

1. Click **New Bucket**.
2. Name: `donation-images`.
3. Set **Public Bucket** to `ON` (or configure signed URLs).
4. Restrict allowed MIME types: `image/jpeg, image/png, image/webp`.
5. Max file size: `5 MB`.
6. Add the Storage Policy:
   - **SELECT**: Public / Anyone can view (`true`).
   - **INSERT**: Authenticated donors (`auth.role() = 'authenticated'`).

---

## 4. Authentication Configuration

In **Supabase Dashboard → Authentication → Providers**:

1. **Email Auth**:
   - Turn on *Confirm Email* if you want email verification.
   - Or configure **Phone OTP (SMS)**: Under Providers → Phone, connect an SMS provider like Twilio, Gupshup, or MSG91.
2. **Google OAuth (Recommended for Donors)**:
   - Enable Google provider with your Google Cloud Console Client ID & Secret for frictionless 1-tap donor signup.

---

## 5. Pre-Launch Legal & Trust Requirements (India / Mumbai)

- [x] **Privacy Policy**: Created at [`/privacy`](file:///c:/Users/golan/Desktop/eva/iva/app/privacy/page.tsx), compliant with India's **Digital Personal Data Protection Act (DPDP Act 2023)**.
- [x] **Terms of Service**: Created at [`/terms`](file:///c:/Users/golan/Desktop/eva/iva/app/terms/page.tsx), detailing permitted vs. prohibited items, facilitator disclaimer, and non-monetary rules.
- [ ] **Grievance Contact**: Configure an inbox for `grievance@gullygood.app` and `support@gullygood.app`.
- [ ] **NGO Vetting Protocol**: Only verify NGOs in [`admin/ngos`](file:///c:/Users/golan/Desktop/eva/iva/app/admin/ngos/page.tsx) that provide a verifiable NGO Darpan ID and Registration Number.

---

## 6. Recommended Phase 1 Pilot Protocol (Bandra / Powai)

1. Onboard **1 to 2 verified partner NGOs** (e.g. Sahaara Trust or local community kitchen).
2. Seed their service radius to 5–8 km in the Admin panel.
3. Invite 20–50 community donors to list essentials.
4. Keep a dedicated WhatsApp operational support channel active for field coordination during the first 14 days.
5. Track pickup completion rate, average time to lock (aim for under 60 minutes), and donor feedback.
