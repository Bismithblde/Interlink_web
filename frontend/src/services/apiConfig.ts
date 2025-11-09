const normalizeBaseUrl = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

export const API_BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_BACKEND_URL) ?? "http://localhost:3001";

export { normalizeBaseUrl };


