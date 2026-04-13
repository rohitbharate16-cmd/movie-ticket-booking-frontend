# Movie Dekho

## Local Setup

Install backend dependencies:

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=4000
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY
CORS_ALLOWED_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
```

Configure the frontend Supabase client by copying `frontend/supabase-config.example.js` to `frontend/supabase-config.js`, then replacing the placeholder values. For deployed/server-rendered pages, you can instead set this before loading module scripts:

```html
<script>
window.__SUPABASE_CONFIG__ = {
  url: "https://YOUR_PROJECT_ID.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY"
};
</script>
```

Run the Supabase migrations in:

```text
backend/supabase-bookings-migration.sql
backend/supabase-stripe-payments-migration.sql
```

Start the backend:

```bash
cd backend
npm run dev
```

Serve the `frontend` folder from an allowed origin, such as `http://127.0.0.1:5500`.
