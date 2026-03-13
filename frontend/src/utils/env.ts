export function getApiBaseUrl(): string {
  const env = import.meta.env;
  return env?.VITE_API_BASE_URL || env?.VITE_API_TARGET || "";
}
