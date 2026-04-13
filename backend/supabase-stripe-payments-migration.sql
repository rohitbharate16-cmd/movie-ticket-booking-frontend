alter table public.bookings
add column if not exists stripe_session_id text,
add column if not exists free_ticket_discount integer not null default 0,
add column if not exists free_ticket_date date;

create unique index if not exists bookings_stripe_session_id_key
on public.bookings (stripe_session_id)
where stripe_session_id is not null;

create unique index if not exists bookings_one_free_ticket_per_movie_day_key
on public.bookings (user_id, movie_id, free_ticket_date)
where free_ticket_discount > 0 and free_ticket_date is not null;
