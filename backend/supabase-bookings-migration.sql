alter table public.bookings
add column if not exists user_email text,
add column if not exists user_name text,
add column if not exists movie_id text,
add column if not exists movie_name text,
add column if not exists show_id text,
add column if not exists show_date text,
add column if not exists show_time text,
add column if not exists hall_name text,
add column if not exists show_format text,
add column if not exists seats jsonb not null default '[]'::jsonb,
add column if not exists snacks jsonb not null default '[]'::jsonb,
add column if not exists seat_total integer not null default 0,
add column if not exists snacks_total integer not null default 0,
add column if not exists total_amount integer not null default 0,
add column if not exists booking_status text not null default 'confirmed',
add column if not exists stripe_session_id text,
add column if not exists free_ticket_discount integer not null default 0,
add column if not exists free_ticket_date date;

update public.bookings
set
  user_email = coalesce(user_email, ''),
  movie_name = coalesce(movie_name, coalesce(movie_id, 'Unknown Movie'))
where user_email is null
   or movie_name is null;

alter table public.bookings
alter column user_email set not null,
alter column movie_name set not null,
alter column seats set default '[]'::jsonb,
alter column snacks set default '[]'::jsonb,
alter column seat_total set default 0,
alter column snacks_total set default 0,
alter column total_amount set default 0,
alter column booking_status set default 'confirmed';

create unique index if not exists bookings_stripe_session_id_key
on public.bookings (stripe_session_id)
where stripe_session_id is not null;

create unique index if not exists bookings_one_free_ticket_per_movie_day_key
on public.bookings (user_id, movie_id, free_ticket_date)
where free_ticket_discount > 0 and free_ticket_date is not null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'bookings'
      and column_name = 'show_date'
      and data_type <> 'date'
  ) then
    alter table public.bookings
    alter column show_date type date
    using nullif(show_date, '')::date;
  end if;
end $$;
