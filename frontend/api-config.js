const DEFAULT_LOCAL_API_BASE = "http://127.0.0.1:4000/api";
const DEFAULT_PRODUCTION_API_BASE = "https://movie-ticket-booking-backend-5u83.onrender.com/api";

const normalizeApiBase = (value) => {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");
  if (!trimmed) {
    return "";
  }

  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const metaConfiguredApiBase = document
  .querySelector('meta[name="movie-dekho-api-base"]')
  ?.getAttribute("content");

const configuredApiBase = normalizeApiBase(
  window.__BACKEND_API_BASE__
  || metaConfiguredApiBase
);

const isLocalHost = ["127.0.0.1", "localhost"].includes(window.location.hostname);
const isFileProtocol = window.location.protocol === "file:";

export const BACKEND_API_BASE = configuredApiBase
  || (isLocalHost || isFileProtocol ? DEFAULT_LOCAL_API_BASE : DEFAULT_PRODUCTION_API_BASE);
