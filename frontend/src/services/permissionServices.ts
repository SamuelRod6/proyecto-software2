export async function fetchResourcePermissionMap() {
  try {
    const res = await fetch("/api/permissions/resource-map");
    if (!res.ok) return {};
    const data = await res.json();
    return data.payload || {};
  } catch (e) {
    return {};
  }
}