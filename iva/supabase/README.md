# Supabase Structure

This folder is the Supabase CLI source of truth for IVA.

## Files

- `migrations/` contains schema and RLS migrations
- `seed.sql` contains local/dev seed data

## Typical workflow

```bash
supabase migration new create_initial_schema
supabase db push
supabase db reset
```

For this repo, the initial migration mirrors the SQL documented in:

- `database/schema.sql`
- `database/rls.sql`

The seed file mirrors:

- `database/seed.sql`
