# Livestock Connect

> Connecting Ugandan farmers directly to buyers.

A mobile-first progressive web app (PWA) that allows farmers to list their livestock for sale with photos, and buyers to browse listings, view animal details, and contact sellers — all from their phone or desktop browser.

** Live App:** [livestock-connect-app.vercel.app](https://livestock-connect-app.vercel.app)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Step 1 — Clone the Repository](#step-1--clone-the-repository)
- [Step 2 — Set Up Supabase](#step-2--set-up-supabase)
- [Step 3 — Set Up Cloudinary](#step-3--set-up-cloudinary)
- [Step 4 — Configure the App](#step-4--configure-the-app)
- [Step 5 — Run Locally](#step-5--run-locally)
- [Step 6 — Deploy to Vercel](#step-6--deploy-to-vercel)
- [Database Schema](#database-schema)
- [Row Level Security](#row-level-security)
- [User Roles](#user-roles)

---

## Features

### Farmer
- Register and log in as a farmer
- Post livestock listings with photo, price, weight, age, health status, and location
- Upload photos directly from phone gallery, camera, or PC files
- Edit and delete own listings
- Dashboard showing total listings and active listings with tap-to-view popups
- Generate a listing summary report

### Buyer
- Register and log in as a buyer
- Browse the full marketplace
- Search listings by animal type or location
- View full animal details including photo
- Contact the farmer directly by phone

### General
- Mobile PWA — installable on Android and iOS home screen
- Font Awesome 6.5.1 icons throughout
- Market price reference guide (UGX)
- Animal health tips and external resource links
- Cloudinary photo uploads with live progress indicator
- Supabase authentication (email + password)
- Row Level Security on all database tables

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JavaScript, HTML5, CSS3 |
| Auth & Database | [Supabase](https://supabase.com) (PostgreSQL + Auth) |
| Image Storage | [Cloudinary](https://cloudinary.com) |
| Hosting | [Vercel](https://vercel.com) |
| Icons | Font Awesome 6.5.1 (CDN) |
| Font | Plus Jakarta Sans (Google Fonts) |
| PWA | Service Worker + Web App Manifest |

---

## Project Structure

```
Livestock-Connect-App/

 index.html # Welcome / landing page
 login.html # Sign in
 register.html # Create account (farmer or buyer)
 dashboard.html # Farmer dashboard with stats
 livestock.html # Farmer's full animal list
 profile.html # User profile
 prices.html # Market price reference (UGX)
 health.html # Animal health tips + external resources
 reports.html # Listing summary report
 404.html # Not found page
 manifest.json # PWA manifest
 sw.js # Service worker (offline caching)
 seed-supabase.js # Optional DB seed script
 .env.example # Template for environment variables

 farmer/
 add-animal.html # Post a new listing with photo upload
 edit-animal.html # Edit an existing listing
 my-listings.html # View and manage all own listings

 buyer/
 marketplace.html # Browse all listings with search
 animal-details.html # Full detail view of a listing
 contact-farmer.html # Farmer contact info + call button

 js/
 supabase.js # Supabase JS client bundle (v2, local copy)
 supabase-client.js # Auth session + getCurrentUser helper
 app.js # Core utilities: formatUGX, requireAuth, etc.
 auth.js # Register and login logic
 livestock.js # Full listing CRUD (Supabase queries)
 cloudinary.js # Photo upload via Cloudinary unsigned preset

 data/
 config.js # ️ App credentials (Supabase + Cloudinary)
 mock-data.js # Animal types, health tips, market prices
 seed.js # Optional seed data

 css/
 styles.css # Base stylesheet

 supabase/
 *.sql # Database migrations (PLpgSQL)
```

---

## Prerequisites

Make sure you have the following before starting:

- **Git** — [git-scm.com](https://git-scm.com)
- **Node.js** — [nodejs.org](https://nodejs.org) (for the local dev server)
- A **Supabase** account — [supabase.com](https://supabase.com) (free tier works)
- A **Cloudinary** account — [cloudinary.com](https://cloudinary.com) (free tier works)
- A **Vercel** account — [vercel.com](https://vercel.com) (free tier works)
- A **GitHub** account

---

## Step 1 — Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/nabide63/Livestock-Connect-App.git
cd Livestock-Connect-App
```

---

## Step 2 — Set Up Supabase

### 2a — Create a new Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Set a project name, a strong database password, and choose a region (Europe West is closest to Uganda)
4. Click **Create new project** and wait about 1 minute for provisioning to finish

### 2b — Copy your API credentials

1. In your Supabase project, go to **Settings → API**
2. Save these two values — you will need them in Step 4:
 - **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
 - **anon / public key** — the long `eyJ...` token

### 2c — Disable email confirmation

1. Go to **Authentication → Settings**
2. Under **Email Auth**, turn **OFF** "Enable email confirmations"
3. Click **Save**

> You can re-enable this in production once you have configured an email provider.

### 2d — Create the database tables

Go to **SQL Editor → New query** and run each block below:

**Profiles table:**
```sql
CREATE TABLE public.profiles (
 id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 full_name text,
 phone text,
 location text,
 role text CHECK (role IN ('farmer', 'buyer')),
 created_at timestamptz DEFAULT now(),
 PRIMARY KEY (id)
);
```

**Listings table:**
```sql
CREATE TABLE public.listings (
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 animal_type text NOT NULL,
 age text DEFAULT '',
 weight text DEFAULT '',
 price text NOT NULL,
 health_status text NOT NULL DEFAULT 'Healthy'
 CHECK (health_status IN ('Healthy','Recovering','Sick','healthy','recovering','sick')),
 location text NOT NULL DEFAULT '',
 description text DEFAULT '',
 image_url text,
 status text DEFAULT 'active',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

CREATE INDEX ON public.listings (user_id);
CREATE INDEX ON public.listings (animal_type);
CREATE INDEX ON public.listings (created_at DESC);
CREATE INDEX ON public.listings (location);
```

**Auto-update trigger:**
```sql
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
 NEW.updated_at = now();
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_listings_updated_at
BEFORE UPDATE ON listings
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

### 2e — Enable Row Level Security

Run this full block in **SQL Editor**:

```sql
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmers can view own listings" ON listings;
DROP POLICY IF EXISTS "Farmers can insert own listings" ON listings;
DROP POLICY IF EXISTS "Farmers can update own listings" ON listings;
DROP POLICY IF EXISTS "Farmers can delete own listings" ON listings;
DROP POLICY IF EXISTS "Buyers can view all listings" ON listings;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Farmers can view own listings"
 ON listings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Farmers can insert own listings"
 ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Farmers can update own listings"
 ON listings FOR UPDATE USING (auth.uid() = user_id)
 WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Farmers can delete own listings"
 ON listings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Buyers can view all listings"
 ON listings FOR SELECT USING (true);

CREATE POLICY "Users can view own profile"
 ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
 ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
 ON profiles FOR UPDATE USING (auth.uid() = id);
```

---

## Step 3 — Set Up Cloudinary

Photo uploads are handled via Cloudinary. This step is required for listing photos to save and display correctly.

### 3a — Create a Cloudinary account

1. Go to [cloudinary.com](https://cloudinary.com) and sign up (free tier is fine)
2. After signing in, note your **Cloud name** shown in the top-left of the dashboard

### 3b — Create an unsigned upload preset

1. Go to **Settings** (gear icon) → **Upload** tab
2. Scroll to **Upload presets** and click **Add upload preset**
3. Set:
 - **Preset name:** `livestock_upload`
 - **Signing Mode:** `Unsigned`
4. Click **Save**

> The preset **must** be **Unsigned** — this lets the browser upload photos directly without exposing any secret key.

---

## Step 4 — Configure the App

Open `data/config.js` and fill in your credentials from Steps 2 and 3:

```js
window.LivestockConnectConfig = {
 cloudinaryCloudName: 'YOUR_CLOUDINARY_CLOUD_NAME',
 cloudinaryUploadPreset: 'livestock_upload',
 supabaseUrl: 'https://YOUR_PROJECT_ID.supabase.co',
 supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

Replace the placeholders with your actual values:

| Placeholder | Where to find it |
|---|---|
| `YOUR_CLOUDINARY_CLOUD_NAME` | Cloudinary dashboard, top-left |
| `YOUR_PROJECT_ID` | Supabase Settings → API → Project URL |
| `YOUR_SUPABASE_ANON_KEY` | Supabase Settings → API → anon/public key |

> **Important:** `data/config.js` is in `.gitignore`. To push it to GitHub (required for Vercel to deploy it), you must force-add it:
> ```bash
> git add -f data/config.js
> ```

---

## Step 5 — Run Locally

### Install live-server

```bash
npm install -g live-server
```

### Start the app

From the root of the project folder:

```bash
live-server
```

The app opens automatically at `http://127.0.0.1:8080`.

> ️ **Do not open `index.html` directly as a file** (via `file:///...`). Supabase authentication requires an HTTP server — it will not work from a `file://` URL.

### Test it works

1. Go to `http://127.0.0.1:8080`
2. Click **Create Account** → register as a **Farmer**
3. Log in and explore the dashboard
4. Try adding a listing with a photo from your phone or computer
5. Open a new browser session, register as a **Buyer**, and browse the marketplace

---

## Step 6 — Deploy to Vercel

### 6a — Push your code to GitHub

```bash
git add -f data/config.js # force-add credentials file
git add -A
git commit -m "Ready for deployment"
git push origin main
```

### 6b — Import the project in Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Find and select `Livestock-Connect-App` from your repositories
4. Leave all settings as default — Vercel auto-detects it as a static site
5. Click **Deploy**

Your app will be live in about 30 seconds at:
`https://livestock-connect-app.vercel.app`

### 6c — Future updates

Every push to `main` triggers an automatic re-deployment:

```bash
git add -A
git commit -m "describe your change"
git push origin main
```

---

## Database Schema

### `profiles`

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Matches `auth.users.id` (primary key) |
| `full_name` | text | User's full name |
| `phone` | text | Phone number |
| `location` | text | Village or district |
| `role` | text | `'farmer'` or `'buyer'` |
| `created_at` | timestamptz | Auto-set on insert |

### `listings`

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key, auto-generated |
| `user_id` | uuid | Foreign key → profiles.id |
| `animal_type` | text | e.g. Cow, Goat, Sheep |
| `age` | text | e.g. "2 years" |
| `weight` | text | In kilograms |
| `price` | text | In UGX |
| `health_status` | text | Healthy / Recovering / Sick |
| `location` | text | Village or district |
| `description` | text | Optional extra details |
| `image_url` | text | Cloudinary `https://` URL |
| `status` | text | `'active'` or `'sold'` |
| `created_at` | timestamptz | Auto-set on insert |
| `updated_at` | timestamptz | Auto-updated on every change |

---

## Row Level Security

| Table | Operation | Who can perform it |
|---|---|---|
| `listings` | SELECT | Farmers see their own rows; buyers see all rows |
| `listings` | INSERT | Farmer only — `user_id` must match the logged-in user |
| `listings` | UPDATE | Listing owner only |
| `listings` | DELETE | Listing owner only |
| `profiles` | SELECT / INSERT / UPDATE | Profile owner only |

---

## User Roles

| Role | Capabilities |
|---|---|
| **Farmer** | Post, edit, delete listings · Upload photos · View dashboard stats · Generate reports · View market prices · View health tips |
| **Buyer** | Browse marketplace · Search by type or location · View animal details · Contact farmers by phone · View market prices |

---

## Notes

- **Supabase anon key** is a public key and safe to commit to GitHub. It is restricted by RLS policies at the database level.
- **Cloudinary upload preset** must be set to **Unsigned** for browser uploads to work.
- **PWA install on Android:** open the app in Chrome → tap the menu (⋮) → "Add to Home Screen".
- **PWA install on iOS:** open in Safari → tap Share (↑) → "Add to Home Screen".

---

*Built at the African Leadership University. This is a student project — Introduction to Software Engineering, Year 2 *
