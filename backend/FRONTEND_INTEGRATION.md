## Frontend Integration Notes

The current frontend still calls Supabase directly from `frontend/script.js`, `frontend/confirm.js`, and related modules.

To switch to this backend:

- call `POST /api/auth/login` instead of `supabase.auth.signInWithPassword(...)`
- store the returned `access_token`
- send `Authorization: Bearer <access_token>` on protected API calls
- replace direct Supabase reads/writes with `fetch("/api/...")` calls

Suggested route mapping:

- movies: `/api/movies`
- food: `/api/food`
- shows: `/api/shows`
- bookings: `/api/bookings`
- uploads: `/api/upload/movie-poster` and `/api/upload/food-image`

The Supabase service role key must remain server-side only. Do not expose it in frontend code.
