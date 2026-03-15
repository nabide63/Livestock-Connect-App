# Livestock Connect – Supabase backend

This folder contains **migrations** and config for the Supabase backend. The schema matches the app’s data model (profiles, listings, reference data) and uses **Row Level Security (RLS)** for access control.

---

## Tables

| Table           | Purpose |
|----------------|---------|
| **profiles**   | User profile (full_name, phone, location, role). `id` = `auth.users.id`. Role: `farmer` or `buyer`. |
| **listings**   | Livestock for sale. `user_id` → profiles (farmer). Only farmers can insert; owners can update/delete. |
| **market_prices** | Reference: animal type and price in UGX. Seeded. |
| **health_tips**   | Reference: tip icon, title, description. Seeded. |

---

## Running migrations

### Option A: Supabase Dashboard (hosted project)

1. Create a project at [supabase.com](https://supabase.com).
2. In the project: **SQL Editor** → New query.
3. Run each migration file in order:
   - `20250315000001_create_profiles.sql`
   - `20250315000002_create_listings.sql`
   - `20250315000003_create_reference_tables.sql`

### Option B: Supabase CLI (local or linked project)

```bash
# Install CLI: npm i -g supabase

# Link to your hosted project (get project ref and anon key from Dashboard → Settings → API)
supabase link --project-ref YOUR_PROJECT_REF

# Run all migrations
supabase db push
```

For **local** development:

```bash
supabase start
supabase db reset   # applies migrations and seed
# Use: API URL = http://127.0.0.1:54321, anon key from `supabase status`
```

---

## Auth and profiles

- **Auth** is handled by Supabase Auth (`auth.users`). Use **email** + password (e.g. use phone as email: `0772123456@livestock.local`).
- After sign-up or sign-in, create or update a row in **profiles** with the same `id` as `auth.users.id`, and set `full_name`, `phone`, `location`, `role` (and keep `phone` in sync for your app’s “login by phone” flow if needed).

---

## Frontend integration

- Use **Supabase JS client**: `@supabase/supabase-js`.
- **Auth**: `supabase.auth.signUp()`, `supabase.auth.signInWithPassword()`, `supabase.auth.getUser()`.
- **Profiles**: `supabase.from('profiles').select()`, `.insert()`, `.update()` (with RLS).
- **Listings**: `supabase.from('listings').select()`, `.insert()` (as farmer), `.update()` / `.delete()` (own rows only).

Environment variables (or config):

- `VITE_SUPABASE_URL` or `SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`

---

## Migration file order

1. `20250315000001_create_profiles.sql` – profiles + RLS + trigger
2. `20250315000002_create_listings.sql` – listings + RLS (uses `handle_updated_at`)
3. `20250315000003_create_reference_tables.sql` – market_prices, health_tips + seed
