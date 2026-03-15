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
   - `20250315000004_cloudinary_integration.sql`

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

---

## Cloudinary + Supabase (livestock photos)

Images are uploaded to **Cloudinary** (cloud name: `dprfszxkv`). The app then stores the returned URL in Supabase:

1. **Frontend**: User selects a photo → upload to Cloudinary (unsigned preset) → get `secure_url`.
2. **Supabase**: When inserting/updating a listing, set `image_url` = Cloudinary `secure_url`.
3. **Display**: Use `listings.image_url` as the `src` for the livestock photo.

So **Cloudinary** = storage and delivery of images; **Supabase** = storage of the listing row and its `image_url`. No direct link between the two services—the app connects them by saving the Cloudinary URL into the Supabase `listings.image_url` column.

---

## Environment variables (or config)

- `VITE_SUPABASE_URL` or `SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` or `SUPABASE_ANON_KEY`

---

## Migration file order

1. `20250315000001_create_profiles.sql` – profiles + RLS + trigger
2. `20250315000002_create_listings.sql` – listings + RLS, `image_url` for Cloudinary
3. `20250315000003_create_reference_tables.sql` – market_prices, health_tips + seed
4. `20250315000004_cloudinary_integration.sql` – `listings.image_url` must be null or http(s) URL (Cloudinary)
