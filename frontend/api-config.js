export const BACKEND_API_BASE = ["127.0.0.1", "localhost"].includes(window.location.hostname)
  ? "http://127.0.0.1:4000/api"
  : `${window.location.origin}/api`;
