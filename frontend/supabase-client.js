import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const projectConfig = {
  url: "https://nhtsybfppoyrpopjmjbc.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5odHN5YmZwcG95cnBvcGptamJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MDc4MzAsImV4cCI6MjA5MTQ4MzgzMH0.IgmGbC7X_IFFOuxfA5kVooESzY5njKgIab8f4osqvlM"
};

const pickSupabaseConfig = (...configs) => configs.find((config) =>
  config
  && typeof config === "object"
  && (String(config.url || "").trim() || String(config.anonKey || "").trim())
) || {};

export const SUPABASE_SETUP_MESSAGE =
  "Set window.__SUPABASE_CONFIG__ with your Supabase project URL and anon key before going live.";

const runtimeConfig = pickSupabaseConfig(
  window.__SUPABASE_CONFIG__,
  projectConfig
);

export const SUPABASE_URL = String(runtimeConfig.url || "");
export const SUPABASE_ANON_KEY = String(runtimeConfig.anonKey || "");

export const isSupabaseConfigured = () =>
  Boolean(SUPABASE_URL)
  && Boolean(SUPABASE_ANON_KEY)
  && !SUPABASE_URL.includes("YOUR_PROJECT_ID")
  && !SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY");

const TAB_SESSION_BRIDGE_PREFIX = "__MOVIE_DEKHO_SUPABASE_SESSION__:";

const readTabSessionBridge = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = String(window.name || "");
  if (!rawValue.startsWith(TAB_SESSION_BRIDGE_PREFIX)) {
    return null;
  }

  try {
    return JSON.parse(rawValue.slice(TAB_SESSION_BRIDGE_PREFIX.length));
  } catch (error) {
    return null;
  }
};

const writeTabSessionBridge = (value) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!value) {
    window.name = "";
    return;
  }

  window.name = `${TAB_SESSION_BRIDGE_PREFIX}${JSON.stringify(value)}`;
};

export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

export const persistTabSessionBridge = (session) => {
  if (!session?.access_token || !session?.refresh_token) {
    writeTabSessionBridge(null);
    return;
  }

  writeTabSessionBridge({
    access_token: session.access_token,
    refresh_token: session.refresh_token
  });
};

export const clearTabSessionBridge = () => {
  writeTabSessionBridge(null);
};

export const restoreSupabaseSessionFromBridge = async () => {
  if (!supabase) {
    return null;
  }

  const bridgedSession = readTabSessionBridge();
  if (!bridgedSession?.access_token || !bridgedSession?.refresh_token) {
    return null;
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: bridgedSession.access_token,
    refresh_token: bridgedSession.refresh_token
  });

  if (error || !data?.session) {
    clearTabSessionBridge();
    return null;
  }

  persistTabSessionBridge(data.session);
  return data.session;
};
