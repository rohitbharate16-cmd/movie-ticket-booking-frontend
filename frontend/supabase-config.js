import { SUPABASE_CONFIG as EXAMPLE_SUPABASE_CONFIG } from "./supabase-config.example.js";

const projectConfig = {
  url: "https://nhtsybfppoyrpopjmjbc.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odHN5YmZwcG95cnBvcGptamJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDc4MzAsImV4cCI6MjA5MTQ4MzgzMH0.IgmGbC7X_IFFOuxfA5kVooESzY5njKgIab8f4osqvlM"
};

const pickSupabaseConfig = (...configs) => configs.find((config) =>
  config
  && typeof config === "object"
  && (String(config.url || "").trim() || String(config.anonKey || "").trim())
) || {};

const runtimeConfig = pickSupabaseConfig(
  window.__SUPABASE_CONFIG__,
  projectConfig,
  EXAMPLE_SUPABASE_CONFIG
);

export const SUPABASE_URL = String(runtimeConfig.url || "");
export const SUPABASE_ANON_KEY = String(runtimeConfig.anonKey || "");

export const isSupabaseConfigured = () =>
  Boolean(SUPABASE_URL)
  && Boolean(SUPABASE_ANON_KEY)
  && !SUPABASE_URL.includes("YOUR_PROJECT_ID")
  && !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");

export const SUPABASE_SETUP_MESSAGE =
  "Set window.__SUPABASE_CONFIG__ or update frontend/supabase-config.js with your Supabase project URL and anon key before going live.";
