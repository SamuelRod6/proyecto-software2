export function getApiBaseUrl(): string {
  const env = import.meta.env;
  return env?.VITE_API_TARGET || "";
}
