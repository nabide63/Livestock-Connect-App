-- Livestock Connect: Profiles (extends Supabase Auth)
-- Links auth.users to app profile: full_name, phone, location, role (farmer | buyer).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null unique,
  location text not null default '',
  role text not null check (role in ('farmer', 'buyer')) default 'buyer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'App user profiles; id matches auth.users. Role: farmer (seller) or buyer.';
comment on column public.profiles.phone is 'Unique phone number for login (e.g. 0772123456).';
comment on column public.profiles.role is 'farmer = can post listings; buyer = can browse and contact.';

create index if not exists idx_profiles_phone on public.profiles(phone);
create index if not exists idx_profiles_role on public.profiles(role);

alter table public.profiles enable row level security;

create policy "Users can read all profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();
