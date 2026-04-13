create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    case
      when new.email = 'admin@moviedekho.com' then 'admin'
      else 'user'
    end
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

delete from auth.identities
where user_id in (
  select id
  from auth.users
  where email in ('user@moviedekho.com', 'admin@moviedekho.com')
);

delete from public.profiles
where email in ('user@moviedekho.com', 'admin@moviedekho.com');

delete from auth.users
where email in ('user@moviedekho.com', 'admin@moviedekho.com');

with new_users as (
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  values
    (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'user@moviedekho.com',
      crypt('user123', gen_salt('bf')),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Movie Dekho User"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    ),
    (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'admin@moviedekho.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Movie Dekho Admin"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    )
  returning id, email
)
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  id,
  jsonb_build_object(
    'sub', id::text,
    'email', email,
    'email_verified', true
  ),
  'email',
  id::text,
  now(),
  now()
from new_users;

update public.profiles
set role = 'admin'
where email = 'admin@moviedekho.com';
