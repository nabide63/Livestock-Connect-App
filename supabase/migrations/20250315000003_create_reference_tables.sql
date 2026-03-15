-- Livestock Connect: Reference data (market prices, health tips)
-- Read-only for app; can be updated by admin or seed.

create table if not exists public.market_prices (
  id uuid primary key default gen_random_uuid(),
  type text not null unique,
  price bigint not null,
  unit text not null default 'UGX',
  updated_at timestamptz not null default now()
);

comment on table public.market_prices is 'Current market prices per animal type (UGX).';

create table if not exists public.health_tips (
  id uuid primary key default gen_random_uuid(),
  icon text default '💚',
  title text not null,
  description text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.health_tips is 'Health tips for farmers (read-only in app).';

create index if not exists idx_health_tips_sort on public.health_tips(sort_order);

alter table public.market_prices enable row level security;
alter table public.health_tips enable row level security;

create policy "Anyone can read market_prices"
  on public.market_prices for select
  to authenticated
  using (true);

create policy "Anyone can read health_tips"
  on public.health_tips for select
  to authenticated
  using (true);

-- Seed market prices (run once)
insert into public.market_prices (type, price, unit) values
  ('Cow', 1200000, 'UGX'),
  ('Goat', 250000, 'UGX'),
  ('Sheep', 300000, 'UGX'),
  ('Poultry', 35000, 'UGX')
on conflict (type) do update set
  price = excluded.price,
  unit = excluded.unit,
  updated_at = now();

-- Seed health tips (idempotent: only if empty)
insert into public.health_tips (icon, title, description, sort_order)
select * from (values
  ('💉'::text, 'Vaccinate animals regularly'::text, 'Keep your animals healthy by giving vaccines on time. Ask your vet for a schedule.'::text, 1),
  ('💧', 'Provide clean water', 'Animals need fresh, clean water every day. Change water often and keep containers clean.', 2),
  ('⚖️', 'Monitor weight weekly', 'Weigh your animals to see if they are growing well. Write down the numbers.', 3),
  ('🏠', 'Separate sick animals', 'When an animal is sick, keep it away from others so illness does not spread.', 4)
) as v(icon, title, description, sort_order)
where not exists (select 1 from public.health_tips limit 1);
