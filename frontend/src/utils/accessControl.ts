import { getRolePermissions, getRoles } from "../services/roleServices";

const USER_KEY = "auth-user";
const RESOURCE_PERMISSION_KEY = "resource-permissions";

type StoredUser = {
  role?: string;
  roles?: Array<string | { id?: number; name?: string }>;
};

type RoleRow = {
    id: number;
    name: string;
};

type PermissionRow = {
    id: number;
    name: string;
    resource?: string;
};

export function getStoredUserRole(): string | null {
  const roles = getStoredUserRoleNames();
  return roles[0] ?? null;
}

export function getStoredUserRoleNames(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredUser;
    const rawRoles = parsed.roles ?? parsed.role ?? [];
    if (Array.isArray(rawRoles)) {
      return rawRoles
        .map((role) => {
          if (typeof role === "string") return role;
          return role?.name ?? "";
        })
        .map((role) => String(role).trim())
        .filter(Boolean);
    }
    return String(rawRoles)
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function getStoredUserRoleIds(): number[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredUser;
    const rawRoles = parsed.roles ?? [];
    if (!Array.isArray(rawRoles)) return [];
    return rawRoles
      .map((role) => {
        if (typeof role === "string") return Number.NaN;
        return Number(role?.id);
      })
      .filter((id) => Number.isFinite(id));
  } catch {
    return [];
  }
}

export function isAdminRole(role: string | null | undefined): boolean {
    return String(role || "").trim().toUpperCase() === "ADMIN";
}

export function isAdminUser(): boolean {
  return getStoredUserRoleNames().some((role) => isAdminRole(role));
}

export function getResourcePermissionMap(): Record<string, number> {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem(RESOURCE_PERMISSION_KEY);
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw) as Record<string, number>;
        if (parsed && typeof parsed === "object") {
            return parsed;
        }
        return {};
    } catch {
        return {};
    }
}

export function setResourcePermissionMap(map: Record<string, number>): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(RESOURCE_PERMISSION_KEY, JSON.stringify(map));
}

function normalizeRoles(payload: unknown): RoleRow[] {
    const root = (payload as { payload?: unknown })?.payload ?? payload;
    const list = Array.isArray(root)
        ? root
        : (root as { roles?: unknown; data?: unknown })?.roles ??
          (root as { data?: unknown })?.data;

    if (!Array.isArray(list)) return [];

    return list.map((item) => {
        const record = item as Record<string, unknown>;
        return {
            id: Number(record.id ?? record.id_rol ?? record.idRol ?? 0),
            name: String(record.name ?? record.nombre_rol ?? ""),
        };
    });
}

function normalizePermissions(payload: unknown): PermissionRow[] {
    const root = (payload as { payload?: unknown })?.payload ?? payload;
    const list = Array.isArray(root)
        ? root
        : (root as { permissions?: unknown; data?: unknown })?.permissions ??
          (root as { data?: unknown })?.data;

    if (!Array.isArray(list)) return [];

    return list.map((item, index) => {
        const record = item as Record<string, unknown>;
        return {
            id: Number(record.id ?? record.id_permiso ?? index + 1),
            name: String(record.name ?? record.nombre_permiso ?? "Permiso"),
            resource: String(record.resource ?? record.recurso ?? ""),
        };
    });
}

export async function hasResourceAccess(resourceKey: string): Promise<boolean> {
    const userRoleNames = getStoredUserRoleNames();
    if (userRoleNames.some((role) => isAdminRole(role))) return true;

    const map = getResourcePermissionMap();
    const requiredPermissionId = map[resourceKey];
    if (!requiredPermissionId) return false;

    let roleIds = getStoredUserRoleIds();
    if (roleIds.length === 0 && userRoleNames.length > 0) {
      const rolesResponse = await getRoles();
      if (rolesResponse.status < 400) {
        const roles = normalizeRoles(rolesResponse.data);
        roleIds = roles
          .filter((item) =>
            userRoleNames.some(
              (role) =>
                item.name.trim().toLowerCase() === role.trim().toLowerCase(),
            ),
          )
          .map((role) => role.id)
          .filter((id) => Number.isFinite(id) && id > 0);
      }
    }

    if (roleIds.length === 0) return false;

    const permissionsResponses = await Promise.all(
      roleIds.map((roleId) => getRolePermissions(roleId)),
    );

    return permissionsResponses.some((response) => {
      if (response.status >= 400) return false;
      const permissions = normalizePermissions(response.data);
      return permissions.some(
        (permission) => permission.id === requiredPermissionId,
      );
    });
}
