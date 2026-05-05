import { API_BASE_URL } from "../services/api";

/**
 * Base URL for backend uploads (no /api/v1). Backend serves static files at /uploads.
 */
const UPLOADS_BASE = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

/**
 * Convert a stored image path to a URL for display.
 * In dev, uses relative /uploads/... so Vite proxy sends requests to backend (fixes broken images).
 * Handles: full URL, /uploads/..., uploads/..., and Windows backslashes.
 */
export function getImageUrl(path) {
  if (!path || typeof path !== "string") return null;
  const p = path.replace(/\\/g, "/").trim();
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const normalized = p.startsWith("/") ? p : `/${p}`;
  // In development, use relative path so request goes to same origin and Vite proxies to backend
  if (import.meta.env.DEV && normalized.startsWith("/uploads"))
    return normalized;
  return `${UPLOADS_BASE}${normalized}`;
}

export { UPLOADS_BASE };
