import axios from "axios";
import { getApiBaseUrl } from "../utils/env";

const apiBaseUrl = getApiBaseUrl();

const api = axios.create({
  baseURL: apiBaseUrl || undefined,
});

const USER_KEY = "auth-user";

const getRoleHeader = (): string | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      role?: string;
      roles?: Array<string | { name?: string }>;
    };
    const rawRoles = parsed.roles ?? parsed.role ?? [];
    const rolesList: string[] = [];

    if (Array.isArray(rawRoles)) {
      for (const item of rawRoles) {
        if (typeof item === "string" && item.trim()) {
          rolesList.push(item.trim());
          continue;
        }
        if (typeof item === "object" && item?.name) {
          rolesList.push(String(item.name).trim());
        }
      }
    } else {
      const first = String(rawRoles).split(",")[0];
      if (first) rolesList.push(first.trim());
    }

    if (rolesList.length === 0) return null;
    const uniqueRoles = Array.from(
      new Set(rolesList.map((role) => role.trim()).filter(Boolean)),
    );
    return uniqueRoles.length > 0 ? uniqueRoles.join(",") : null;
  } catch {
    return null;
  }
};

export interface UserRoleRow {
  id: number;
  name: string;
  roles: string[];
}

export interface RoleOption {
  id: number;
  name: string;
  description?: string;
}

export interface UpdateUserRolesPayload {
  user_id: number;
  roles: string[];
}

export interface PermissionRow {
  id: number;
  name: string;
  resource?: string;
}

export async function getUsers(
  limit: number,
  offset: number,
): Promise<{ status: number; data: any }> {
  try {
    const response = await api.get("/api/users", {
      params: { limit, offset },
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
    const response = await api.get("/api/roles");
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function createRole(payload: {
  name: string;
  description?: string;
}): Promise<{ status: number; data: any }> {
  try {
    const response = await api.post("/api/roles", payload);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function updateRole(
  roleId: number,
  payload: { name: string; description?: string },
): Promise<{ status: number; data: any }> {
  try {
    const response = await api.put(`/api/roles/${roleId}`, payload);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function deleteRole(
  roleId: number,
): Promise<{ status: number; data: any }> {
  try {
    const response = await api.delete(`/api/roles/${roleId}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function updateUserRoles(
  payload: UpdateUserRolesPayload,
): Promise<{ status: number; data: any }> {
  try {
    const roleHeader = getRoleHeader();
    const response = await api.put("/api/user/assign-roles", payload, {
      headers: {
        ...(roleHeader ? { "X-Role": roleHeader } : {}),
      },
    });
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function getPermissions(): Promise<{ status: number; data: any }> {
  try {
    const response = await api.get("/api/permissions");
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function createPermission(payload: {
  name: string;
  resource?: string;
}): Promise<{ status: number; data: any }> {
  try {
    const response = await api.post("/api/permissions", payload);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function updatePermission(
  permissionId: number,
  payload: { name: string; resource?: string },
): Promise<{ status: number; data: any }> {
  try {
    const response = await api.put(`/api/permissions/${permissionId}`, payload);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function deletePermission(
  permissionId: number,
): Promise<{ status: number; data: any }> {
  try {
    const response = await api.delete(`/api/permissions/${permissionId}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function getResources(): Promise<{ status: number; data: any }> {
  try {
    const response = await api.get("/api/resources");
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function getRolePermissions(
  roleId: number,
): Promise<{ status: number; data: any }> {
  try {
    const response = await api.get(`/api/roles/${roleId}/permissions`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function updateRolePermissions(
  roleId: number,
  permissionIds: number[],
): Promise<{ status: number; data: any }> {
  try {
    const response = await api.put(`/api/roles/${roleId}/permissions`, {
      permission_ids: permissionIds,
    });
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}