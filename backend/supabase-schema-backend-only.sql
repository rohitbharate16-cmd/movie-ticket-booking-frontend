create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  user_email text not null,
  user_name text,
  movie_id text,
  movie_name text not null,
  show_id text,
  show_date date,
  show_time text,
  hall_name text,
  show_format text,
  seats jsonb not null default '[]'::jsonb,
  snacks jsonb not null default '[]'::jsonb,
  seat_total integer not null default 0,
  snacks_total integer not null default 0,
  total_amount integer not null default 0,
  stripe_session_id text,
  free_ticket_discount integer not null default 0,
  free_ticket_date date,
  booking_status text not null default 'confirmed'
    check (booking_status in ('confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;
alter table public.bookings enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

drop policy if exists "profiles select own row" on public.profiles;
create policy "profiles select own row"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles insert own row" on public.profiles;
create policy "profiles insert own row"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles update own row" on public.profiles;
create policy "profiles update own row"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "bookings own read" on public.bookings;
create policy "bookings own read"
on public.bookings
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "bookings authenticated insert" on public.bookings;
create policy "bookings authenticated insert"
on public.bookings
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "bookings own update" on public.bookings;
create policy "bookings own update"
on public.bookings
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "bookings admin delete" on public.bookings;
create policy "bookings admin delete"
on public.bookings
for delete
to authenticated
using (public.is_admin());
