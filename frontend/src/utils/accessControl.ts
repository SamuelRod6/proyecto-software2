import { getRolePermissions, getRoles } from "../services/roleServices";

const USER_KEY = "auth-user";
const RESOURCE_PERMISSION_KEY = "resource-permissions";

type StoredUser = {
    role?: string;
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
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as StoredUser;
        return parsed.role ?? null;
    } catch {
        return null;
    }
}

export function isAdminRole(role: string | null | undefined): boolean {
    return String(role || "").trim().toUpperCase() === "ADMIN";
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
    const role = getStoredUserRole();
    if (isAdminRole(role)) return true;

    const map = getResourcePermissionMap();
    const requiredPermissionId = map[resourceKey];
    if (!requiredPermissionId) return false;

    const rolesResponse = await getRoles();
    if (rolesResponse.status >= 400) return false;
    const roles = normalizeRoles(rolesResponse.data);
    const currentRole = roles.find(
        (item) => item.name.trim().toLowerCase() === String(role || "").trim().toLowerCase(),
    );
    if (!currentRole) return false;

    const permissionsResponse = await getRolePermissions(currentRole.id);
    if (permissionsResponse.status >= 400) return false;
    const permissions = normalizePermissions(permissionsResponse.data);
    return permissions.some((permission) => permission.id === requiredPermissionId);
}
