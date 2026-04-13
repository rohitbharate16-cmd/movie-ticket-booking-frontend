export const SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT_ID.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY"
};

const runtimeConfig = window.__SUPABASE_CONFIG__ || SUPABASE_CONFIG;

export const SUPABASE_URL = String(runtimeConfig.url || "");
export const SUPABASE_ANON_KEY = String(runtimeConfig.anonKey || "");

export const isSupabaseConfigured = () =>
  Boolean(SUPABASE_URL)
  && Boolean(SUPABASE_ANON_KEY)
  && !SUPABASE_URL.includes("YOUR_PROJECT_ID")
  && !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");

export const SUPABASE_SETUP_MESSAGE =
  "Set window.__SUPABASE_CONFIG__ or update frontend/supabase-config.js with your Supabase project URL and anon key before going live.";
