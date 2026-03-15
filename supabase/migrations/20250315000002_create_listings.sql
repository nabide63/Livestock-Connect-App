-- Livestock Connect: Listings (livestock for sale)
-- Farmers post; buyers browse. RLS: select all, insert/update/delete own.

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  animal_type text not null,
  age text default '',
  weight text default '',
  price text not null,
  health_status text not null default 'Healthy' check (
    health_status in ('Healthy', 'Needs Checkup', 'Sick')
  ),
  location text not null default '',
  description text default '',
  image_url text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.listings is 'Livestock listings for sale; only farmers (profiles.role=farmer) should insert.';
comment on column public.listings.user_id is 'Farmer who posted (references profiles.id).';
comment on column public.listings.animal_type is 'Cow, Goat, Sheep, Poultry.';
comment on column public.listings.price is 'Price in UGX as text for flexibility.';

create index if not exists idx_listings_user_id on public.listings(user_id);
create index if not exists idx_listings_animal_type on public.listings(animal_type);
create index if not exists idx_listings_created_at on public.listings(created_at desc);
create index if not exists idx_listings_location on public.listings(location);

alter table public.listings enable row level security;

create policy "Anyone authenticated can read listings"
  on public.listings for select
  to authenticated
  using (true);

create policy "Farmers can insert own listings"
  on public.listings for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'farmer'
    )
  );

create policy "Owners can update own listings"
  on public.listings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Owners can delete own listings"
  on public.listings for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger set_listings_updated_at
  before update on public.listings
  for each row
  execute function public.handle_updated_at();
