create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.movies (
  id text primary key,
  name text not null,
  image_url text not null,
  rating text,
  votes text,
  duration text,
  genre text,
  certificate text,
  release_date text,
  formats text,
  languages text,
  summary text,
  critic_rating text,
  highlights jsonb not null default '[]'::jsonb,
  trailer_url text,
  regular_price integer not null default 0,
  silver_price integer not null default 0,
  gold_price integer not null default 0,
  is_custom boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.food_items (
  id text primary key,
  name text not null,
  category text not null,
  price integer not null default 0,
  badge text,
  art_label text,
  image_url text,
  description text not null,
  is_custom boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shows (
  id text primary key,
  movie_id text not null references public.movies (id) on delete cascade,
  hall_id integer not null,
  show_date date not null,
  show_time integer not null,
  format text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;
alter table public.movies enable row level security;
alter table public.food_items enable row level security;
alter table public.shows enable row level security;

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

drop policy if exists "movies public read" on public.movies;
create policy "movies public read"
on public.movies
for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "movies admin write" on public.movies;
create policy "movies admin write"
on public.movies
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "food public read" on public.food_items;
create policy "food public read"
on public.food_items
for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "food admin write" on public.food_items;
create policy "food admin write"
on public.food_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "shows public read" on public.shows;
create policy "shows public read"
on public.shows
for select
to anon, authenticated
using (true);

drop policy if exists "shows admin write" on public.shows;
create policy "shows admin write"
on public.shows
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

update public.profiles
set role = 'admin'
where email = 'admin@moviedekho.com';

insert into storage.buckets (id, name, public)
values ('movie-posters', 'movie-posters', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "movie posters public read" on storage.objects;
create policy "movie posters public read"
on storage.objects
for select
to public
using (bucket_id = 'movie-posters');

drop policy if exists "movie posters admin upload" on storage.objects;
create policy "movie posters admin upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'movie-posters'
  and public.is_admin()
);

drop policy if exists "movie posters admin update" on storage.objects;
create policy "movie posters admin update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'movie-posters'
  and public.is_admin()
)
with check (
  bucket_id = 'movie-posters'
  and public.is_admin()
);

drop policy if exists "movie posters admin delete" on storage.objects;
create policy "movie posters admin delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'movie-posters'
  and public.is_admin()
);
