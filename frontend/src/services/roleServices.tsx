import axios from "axios";

export interface UserRoleRow {
    id: number;
    name: string;
    role: string;
}

export interface RoleOption {
    id: number;
    name: string;
}

export interface UpdateRolePayload {
    user_id: number;
    rol: string;
}

export async function getUsers(limit: number, offset: number): Promise<{ status: number; data: any }> {
    try {
        const response = await axios.get("/api/users", {
            params: { limit, offset }
        });
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { error: "Error de red o desconocido" } };
    }
}


export async function getRoles(): Promise<{ status: number; data: any }> {
    try {
        const response = await axios.get("/api/roles");
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { error: "Error de red o desconocido" } };
    }
}

export async function updateUserRole(payload: UpdateRolePayload): Promise<{ status: number; data: any }> {
    try {
        const response = await axios.put("/api/user/assign-role", payload, {
            headers: {
                "X-Role": "ADMIN",
            }
        });
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { error: "Error de red o desconocido" } };
    }
}

export function normalizeUsers(payload: unknown): UserRoleRow[] {
    const root = (payload as { payload?: unknown })?.payload ?? payload;
    const list = Array.isArray(root)
        ? root
        : (root as { users?: unknown; data?: unknown })?.users ??
          (root as { data?: unknown })?.data;

    if (!Array.isArray(list)) return [];

    return list.map((item, index) => {
        const record = item as Record<string, unknown>;
        return {
            id: Number(record.id ?? record.id_usuario ?? index + 1),
            name: String(record.name ?? record.nombre ?? record.email ?? "Usuario"),
            role: String(record.role ?? record.rol ?? record.nombre_rol ?? ""),
        };
    });
}

export function normalizeRoles(payload: unknown): RoleOption[] {
    const root = (payload as { payload?: unknown })?.payload ?? payload;
    const list = Array.isArray(root)
        ? root
        : (root as { roles?: unknown; data?: unknown })?.roles ??
          (root as { data?: unknown })?.data;

    if (!Array.isArray(list)) return [];

    return list.map((item, index) => {
        const record = item as Record<string, unknown>;
        return {
            id: Number(record.id ?? record.id_rol ?? record.idRol ?? index + 1),
            name: String(record.name ?? record.nombre_rol ?? record.rol ?? ""),
        };
    });
}