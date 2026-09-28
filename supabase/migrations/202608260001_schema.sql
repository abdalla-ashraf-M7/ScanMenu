-- ============================================================
-- ScanMenu — full schema (applied via `supabase db push`)
-- Order matters: tables → helper functions → RLS.
-- ============================================================

create extension if not exists "pgcrypto";

-- ── restaurants ──────────────────────────────────────────────
create table if not exists public.restaurants (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null check (slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$'),
  name_ar          text not null,
  tagline_ar       text,
  whatsapp_number  text not null check (whatsapp_number ~ '^[1-9][0-9]{7,14}$'),
  address_ar       text,
  map_url          text,
  logo_url         text,
  cover_image_url  text,
  currency_symbol  text not null default 'ج.م',
  delivery_enabled boolean not null default true,
  pickup_enabled   boolean not null default true,
  min_prep_minutes integer not null default 20 check (min_prep_minutes between 5 and 240),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

-- ── profiles (needs restaurants to exist for FK) ────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null default 'owner' check (role in ('owner','admin')),
  restaurant_id uuid references public.restaurants(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ── helper: is current user a platform admin? ────────────────
create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── categories ───────────────────────────────────────────────
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name_ar       text not null,
  sort_order    int  not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists categories_restaurant_idx on public.categories(restaurant_id, sort_order);

-- ── menu_items ───────────────────────────────────────────────
create table if not exists public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id   uuid not null references public.categories(id) on delete cascade,
  name_ar       text not null,
  description_ar text,
  price         numeric(10,2) not null check (price > 0),
  image_url     text,
  sort_order    int  not null default 0,
  is_active     boolean not null default true,
  is_sold_out   boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists items_restaurant_idx   on public.menu_items(restaurant_id, sort_order);
create index if not exists items_category_idx     on public.menu_items(category_id);

-- ── opening_hours ────────────────────────────────────────────
create table if not exists public.opening_hours (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  weekday       smallint not null check (weekday between 0 and 6), -- 0=Saturday … 6=Friday
  opens_at      time,
  closes_at     time,
  is_closed     boolean not null default false,
  unique (restaurant_id, weekday)
);

-- ── updated_at trigger helper ────────────────────────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
alter table public.restaurants add column if not exists updated_at timestamptz not null default now();
drop trigger if exists restaurants_touch on public.restaurants;
create trigger restaurants_touch before update on public.restaurants
for each row execute function public.touch_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.restaurants   enable row level security;
alter table public.categories    enable row level security;
alter table public.menu_items    enable row level security;
alter table public.opening_hours enable row level security;

-- profiles: users read own row; admins read all. Profile writes use the
-- service-role client only, since a self-update policy could change role.
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (id = auth.uid() or public.is_platform_admin());

drop policy if exists profiles_self_update on public.profiles;

-- owner helper: does auth.uid() own given restaurant?
create or replace function public.owns_restaurant(rid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner' and restaurant_id = rid
  );
$$;

-- restaurants ─ public read of active; owner manages own; admin all
drop policy if exists restaurants_public_read on public.restaurants;
create policy restaurants_public_read on public.restaurants
  for select using (is_active = true or public.owns_restaurant(id) or public.is_platform_admin());

drop policy if exists restaurants_owner_write on public.restaurants;
create policy restaurants_owner_write on public.restaurants
  for update using (public.owns_restaurant(id));

drop policy if exists restaurants_admin_all on public.restaurants;
create policy restaurants_admin_all on public.restaurants
  for all using (public.is_platform_admin());

-- categories / menu_items / opening_hours: same shape
drop policy if exists cat_public_read on public.categories;
create policy cat_public_read on public.categories
  for select using (is_active and (select is_active from public.restaurants r where r.id = restaurant_id)
                    or public.owns_restaurant(restaurant_id) or public.is_platform_admin());
drop policy if exists cat_owner_write on public.categories;
create policy cat_owner_write on public.categories
  for all using (public.owns_restaurant(restaurant_id));
drop policy if exists cat_admin_all on public.categories;
create policy cat_admin_all on public.categories
  for all using (public.is_platform_admin());

drop policy if exists items_public_read on public.menu_items;
create policy items_public_read on public.menu_items
  for select using ((is_active and (select is_active from public.restaurants r where r.id = restaurant_id))
                    or public.owns_restaurant(restaurant_id) or public.is_platform_admin());
drop policy if exists items_owner_write on public.menu_items;
create policy items_owner_write on public.menu_items
  for all using (public.owns_restaurant(restaurant_id));
drop policy if exists items_admin_all on public.menu_items;
create policy items_admin_all on public.menu_items
  for all using (public.is_platform_admin());

drop policy if exists hours_public_read on public.opening_hours;
create policy hours_public_read on public.opening_hours
  for select using ((select is_active from public.restaurants r where r.id = restaurant_id)
                    or public.owns_restaurant(restaurant_id) or public.is_platform_admin());
drop policy if exists hours_owner_write on public.opening_hours;
create policy hours_owner_write on public.opening_hours
  for all using (public.owns_restaurant(restaurant_id));
drop policy if exists hours_admin_all on public.opening_hours;
create policy hours_admin_all on public.opening_hours
  for all using (public.is_platform_admin());

-- ============================================================
-- Storage bucket: menu-images (public read, owner-scoped write)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

drop policy if exists "menu-images public read" on storage.objects;
create policy "menu-images public read" on storage.objects
  for select using (bucket_id = 'menu-images');

drop policy if exists "menu-images owner write" on storage.objects;
create policy "menu-images owner write" on storage.objects
  for insert with check (
    bucket_id = 'menu-images'
    and public.owns_restaurant(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "menu-images owner delete" on storage.objects;
create policy "menu-images owner delete" on storage.objects
  for delete using (
    bucket_id = 'menu-images'
    and public.owns_restaurant(((storage.foldername(name))[1])::uuid)
  );
