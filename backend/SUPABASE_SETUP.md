# Supabase Setup

1. Create a new Supabase project.
2. Open `SQL Editor` and run [`supabase-schema.sql`](./supabase-schema.sql).
3. In Supabase Auth, enable email/password sign-in.
4. Update [`supabase-config.js`](../frontend/supabase-config.js) with your project URL and anon key.
5. In Supabase Storage, create a public bucket named `movie-posters`.
6. Add storage policies so posters can be read publicly and uploaded by authenticated admins.
7. Create your first admin in Supabase Auth, then run:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@yourdomain.com';
```

## Backend-only option

If you want only backend tables such as `profiles` and `bookings`, run
[`supabase-schema-backend-only.sql`](./supabase-schema-backend-only.sql) instead of
[`supabase-schema.sql`](./supabase-schema.sql).

That backend-only schema creates:

- `public.profiles` for user details like name, email, phone, and role
- `public.bookings` for what the user booked, seats/snacks, total amount, and status

If login/signup is failing or you want fixed demo accounts, run
[`supabase-auth-setup.sql`](./supabase-auth-setup.sql). It creates:

- an auth trigger so every new Supabase user gets a `profiles` row automatically
- `user@moviedekho.com` / `user123`
- `admin@moviedekho.com` / `admin123`

## Notes

- The frontend now reads movies, food, shows, auth, and bookings from Supabase.
- Browser pages now live in `frontend/`, while Supabase schema/setup files live in `backend/`.
- Movie and food posters are stored in the `movie-posters` Supabase Storage bucket, and the database stores the public URL in `movies.image_url` and `food_items.image_url`.
- Admin login only works for users whose row in `public.profiles` has `role = 'admin'`.
- Supabase auth is no longer persisted to `localStorage`; the login stays available only in the current browser tab and is cleared on logout or when the tab is closed.
