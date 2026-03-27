import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../../contexts/Toast/ToastContext";
import Modal from "../../components/ui/Modal";
import SelectInput, { OptionType } from "../../components/ui/SelectorInput";
import Button from "../../components/ui/Button";
import { addUserNotification } from "../../utils/notifications";
import {
  createRole,
  deleteRole,
  getPermissions,
  getRolePermissions,
  getRoles,
  getUsers,
  updateRole,
  updateRolePermissions,
  updateUserRoles,
} from "../../services/roleServices";

type UserRoleRow = {
  id: number;
  name: string;
  email: string;
  roles: string[];
};

type RoleRow = {
  id: number;
  name: string;
  description?: string;
};

type PermissionRow = {
  id: number;
  name: string;
  resource?: string;
};

const PAGE_SIZE = 10;

function normalizeUsers(payload: unknown): UserRoleRow[] {
  const root = (payload as { payload?: unknown })?.payload ?? payload;
  const list = Array.isArray(root)
    ? root
    : ((root as { users?: unknown; data?: unknown })?.users ??
      (root as { data?: unknown })?.data);

  if (!Array.isArray(list)) return [];

  return list.map((item, index) => {
    const record = item as Record<string, unknown>;
    const rawRoles =
      (record.roles as unknown) ??
      record.role ??
      record.rol ??
      record.nombre_rol ??
      "";
    const rolesArray = Array.isArray(rawRoles)
      ? rawRoles.map((r) => String(r))
      : String(rawRoles)
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean);
    return {
      id: Number(record.id ?? record.id_usuario ?? index + 1),
      name: String(record.name ?? record.nombre ?? record.email ?? "Usuario"),
      email: String(record.email ?? record.correo ?? ""),
      roles: rolesArray,
    };
  });
}

function normalizeRoles(payload: unknown): RoleRow[] {
  const root = (payload as { payload?: unknown })?.payload ?? payload;
  const list = Array.isArray(root)
    ? root
    : ((root as { roles?: unknown; data?: unknown })?.roles ??
      (root as { data?: unknown })?.data);

  if (!Array.isArray(list)) return [];

  return list.map((item) => {
    const record = item as Record<string, unknown>;
    return {
      id: Number(record.id ?? record.id_rol ?? record.idRol ?? 0),
      name: String(record.name ?? record.nombre_rol ?? ""),
      description: String(record.description ?? record.descripcion ?? ""),
    };
  });
}

function normalizePermissions(payload: unknown): PermissionRow[] {
  const root = (payload as { payload?: unknown })?.payload ?? payload;
  const list = Array.isArray(root)
    ? root
    : ((root as { permissions?: unknown; data?: unknown })?.permissions ??
      (root as { data?: unknown })?.data);

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

function extractTotal(payload: unknown): number {
  const root = (payload as { payload?: unknown })?.payload ?? payload;
  const raw = (root as { total?: unknown })?.total ?? 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

const arrayEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
};

export default function RoleManagementListScreen(): JSX.Element {
  const [rows, setRows] = useState<UserRoleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRoleRow | null>(null);
  const [roleOptions, setRoleOptions] = useState<OptionType[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [roleRows, setRoleRows] = useState<RoleRow[]>([]);
  const [rolesSectionLoading, setRolesSectionLoading] = useState(false);
  const rolesSectionLoadedRef = useRef(false);
  const [rolePermissionsMap, setRolePermissionsMap] = useState<
    Record<number, PermissionRow[]>
  >({});

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleRow | null>(null);

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] =
    useState<RoleRow | null>(null);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    [],
  );
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  const { showToast } = useToast();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const offset = (page - 1) * PAGE_SIZE;
  const canUpdate = Boolean(
    selectedUser && !arrayEqual(selectedRoles, selectedUser.roles),
  );

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const { status, data } = await getUsers(PAGE_SIZE, offset);
    if (status >= 400) {
      setError("No se pudo cargar usuarios.");
      setRows([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    setRows(normalizeUsers(data));
    setTotal(extractTotal(data));
    setIsLoading(false);
  }, [offset]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const syncRoleOptions = (roles: RoleRow[]) => {
    setRoleOptions(
      roles.map((role) => ({ value: role.name, label: role.name })),
    );
  };

  const loadRoles = useCallback(async () => {
    if (roleOptions.length > 0 || rolesLoading) return;

    setRolesLoading(true);
    const { status, data } = await getRoles();

    if (status >= 400) {
      showToast({
        title: "Error",
        message: "No se pudo cargar los roles.",
        status: "error",
      });
      setRolesLoading(false);
      return;
    }

    const roles = normalizeRoles(data);
    syncRoleOptions(roles);
    setRolesLoading(false);
  }, [roleOptions.length, rolesLoading, showToast]);

  const loadRolesSection = useCallback(async (force = false) => {
    if (!force && rolesSectionLoadedRef.current) return;
    rolesSectionLoadedRef.current = true;
    setRolesSectionLoading(true);

    const { status, data } = await getRoles();
    if (status < 400) {
      const roles = normalizeRoles(data);
      setRoleRows(roles);
      syncRoleOptions(roles);

      const permissionsEntries = await Promise.all(
        roles.map(async (role) => {
          const res = await getRolePermissions(role.id);
          if (res.status >= 400) {
            return [role.id, [] as PermissionRow[]] as const;
          }
          return [role.id, normalizePermissions(res.data)] as const;
        }),
      );

      const nextMap: Record<number, PermissionRow[]> = {};
      permissionsEntries.forEach(([roleId, permissions]) => {
        nextMap[roleId] = permissions;
      });
      setRolePermissionsMap(nextMap);
    }
    setRolesSectionLoading(false);
  }, []);

  const openRoleModal = (user: UserRoleRow) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles);
    setIsModalOpen(true);
    void loadRoles();
  };

  const closeRoleModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setSelectedRoles([]);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);

    const { status } = await updateUserRoles({
      user_id: selectedUser.id,
      roles: selectedRoles,
    });

    if (status >= 400) {
      showToast({
        title: "Error",
        message: "No se pudo actualizar los roles del usuario.",
        status: "error",
      });
      setIsUpdating(false);
      return;
    }

    setRows((prev) =>
      prev.map((row) =>
        row.id === selectedUser.id ? { ...row, roles: selectedRoles } : row,
      ),
    );

    showToast({
      title: "Roles actualizados",
      message: "Los roles del usuario se actualizaron correctamente.",
      status: "success",
    });
    const rolesText =
      selectedRoles.length > 0
        ? selectedRoles.join(", ")
        : "Sin roles asignados";
    addUserNotification(selectedUser.id, `Tus roles actuales: ${rolesText}.`);

    closeRoleModal();
    setIsUpdating(false);
  };

  const openCreateRole = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
    setIsRoleModalOpen(true);
  };

  const openEditRole = (role: RoleRow) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    setIsRoleModalOpen(true);
  };

  const closeRoleEditor = () => {
    setIsRoleModalOpen(false);
    setEditingRole(null);
    setRoleName("");
    setRoleDescription("");
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) return;
    setIsSavingRole(true);

    const payload = {
      name: roleName.trim(),
      description: roleDescription.trim() || undefined,
    };
    const result = editingRole
      ? await updateRole(editingRole.id, payload)
      : await createRole(payload);

    if (result.status >= 400) {
      showToast({
        title: "Error",
        message: "No se pudo guardar el rol.",
        status: "error",
      });
      setIsSavingRole(false);
      return;
    }

    await loadRolesSection(true);
    showToast({
      title: "Rol guardado",
      message: "El rol se guardó correctamente.",
      status: "success",
    });
    closeRoleEditor();
    setIsSavingRole(false);
  };

  const handleDeleteRole = (role: RoleRow) => {
    setRoleToDelete(role);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;

    const { status } = await deleteRole(roleToDelete.id);
    if (status >= 400) {
      showToast({
        title: "Error",
        message: "No se pudo eliminar el rol.",
        status: "error",
      });
      return;
    }

    setRoleRows((prev) => prev.filter((item) => item.id !== roleToDelete.id));
    setRolePermissionsMap((prev) => {
      const next = { ...prev };
      delete next[roleToDelete.id];
      return next;
    });
    await loadRolesSection(true);
    showToast({
      title: "Rol eliminado",
      message: "El rol se eliminó correctamente.",
      status: "success",
    });
    setRoleToDelete(null);
  };

  const openPermissionsModal = async (role: RoleRow) => {
    setSelectedRoleForPermissions(role);
    setIsPermissionsModalOpen(true);
    setPermissionsLoading(true);

    const perms = await getPermissions();
    if (perms.status < 400) {
      setPermissions(normalizePermissions(perms.data));
    }

    const existing = await getRolePermissions(role.id);
    if (existing.status < 400) {
      const list = normalizePermissions(existing.data);
      setSelectedPermissionIds(list.map((permission) => permission.id));
    } else {
      setSelectedPermissionIds([]);
    }

    setPermissionsLoading(false);
  };

  const closePermissionsModal = () => {
    setIsPermissionsModalOpen(false);
    setSelectedRoleForPermissions(null);
    setSelectedPermissionIds([]);
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRoleForPermissions) return;
    setIsSavingPermissions(true);

    const { status } = await updateRolePermissions(
      selectedRoleForPermissions.id,
      selectedPermissionIds,
    );

    if (status >= 400) {
      showToast({
        title: "Error",
        message: "No se pudo actualizar permisos del rol.",
        status: "error",
      });
      setIsSavingPermissions(false);
      return;
    }

    showToast({
      title: "Permisos actualizados",
      message: "Permisos del rol actualizados.",
      status: "success",
    });
    setRolePermissionsMap((prev) => {
      const selectedPermissions = permissions.filter((permission) =>
        selectedPermissionIds.includes(permission.id),
      );
      return {
        ...prev,
        [selectedRoleForPermissions.id]: selectedPermissions,
      };
    });
    setIsSavingPermissions(false);
    closePermissionsModal();
  };

  useEffect(() => {
    void loadRolesSection();
  }, [loadRolesSection]);

  const permissionOptions: OptionType[] = permissions.map((permission) => ({
    value: String(permission.id),
    label: permission.resource
      ? `${permission.name} - ${permission.resource}`
      : permission.name,
  }));

  return (
    <section className="space-y-10 bg-slate-900 min-h-screen px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#F5E427]">
            Roles de usuario
          </h1>
          <p className="text-slate-300">
            Administra los roles y permisos de los usuarios.
          </p>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/80">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">Usuario</th>
              <th className="px-4 py-3 font-semibold">Correo</th>
              <th className="px-4 py-3 font-semibold">Roles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 text-slate-300">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={3}>
                  Cargando usuarios...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={3}>
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={3}>
                  Sin usuarios.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">{row.email || "-"}</td>
                  <td className="px-4 py-3">
                    <button
                      className="text-[#F5E427] hover:underline"
                      onClick={() => openRoleModal(row)}
                    >
                      {row.roles.length > 0
                        ? row.roles.join(", ")
                        : "Sin roles"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
        <span>
          Página {page} de {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-slate-600 px-3 py-1 text-slate-200 transition hover:border-[#F5E427] hover:text-[#F5E427] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Anterior
          </button>
          <button
            className="rounded-md border border-slate-600 px-3 py-1 text-slate-200 transition hover:border-[#F5E427] hover:text-[#F5E427] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Siguiente
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#F5E427]">
            Gestión de roles
          </h2>
          <Button onClick={openCreateRole}>Crear rol</Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/80">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Descripción</th>
                <th className="px-4 py-3 font-semibold">Permisos</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-slate-300">
              {rolesSectionLoading ? (
                <tr>
                  <td className="px-4 py-6 text-center" colSpan={4}>
                    Cargando roles...
                  </td>
                </tr>
              ) : roleRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center" colSpan={4}>
                    Sin roles.
                  </td>
                </tr>
              ) : (
                roleRows.map((role) => (
                  <tr key={role.id}>
                    <td className="px-4 py-3">{role.name}</td>
                    <td className="px-4 py-3">{role.description || "-"}</td>
                    <td className="px-4 py-3">
                      {(rolePermissionsMap[role.id] ?? []).length > 0
                        ? (rolePermissionsMap[role.id] ?? [])
                            .map((permission) =>
                              permission.resource
                                ? `${permission.name} - ${permission.resource}`
                                : permission.name,
                            )
                            .join(", ")
                        : "Sin permisos"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="text-[#F5E427] hover:underline"
                          onClick={() => openEditRole(role)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-slate-300 hover:text-red-400"
                          onClick={() => handleDeleteRole(role)}
                        >
                          Eliminar
                        </button>
                        <button
                          className="text-slate-300 hover:text-[#F5E427]"
                          onClick={() => void openPermissionsModal(role)}
                        >
                          Editar permisos
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={Boolean(roleToDelete)}
        onClose={() => setRoleToDelete(null)}
        title="Eliminar rol"
        className="max-w-md w-full"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            ¿Eliminar el rol{" "}
            <span className="text-slate-100 font-semibold">
              {roleToDelete?.name}
            </span>
            ? Esta accion no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setRoleToDelete(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmDeleteRole}>Eliminar</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isModalOpen}
        onClose={closeRoleModal}
        title="Actualizar roles"
        className="max-w-md w-full"
      >
        <div className="space-y-4">
          <div className="text-sm text-slate-300">
            <span className="font-semibold text-slate-100">
              {selectedUser?.name}
            </span>
            <span className="ml-2 text-slate-400">#{selectedUser?.id}</span>
          </div>

          {rolesLoading ? (
            <div className="text-sm text-slate-400">Cargando roles...</div>
          ) : (
            <SelectInput
              value={selectedRoles}
              onChange={(value) => setSelectedRoles(value as string[])}
              options={roleOptions}
              inputLabel="Roles"
              placeholder="Selecciona uno o varios roles"
              allowCustom={false}
              isMulti
            />
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={closeRoleModal}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={!canUpdate || isUpdating || rolesLoading}
            >
              Actualizar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isRoleModalOpen}
        onClose={closeRoleEditor}
        title={editingRole ? "Editar rol" : "Crear rol"}
        className="max-w-md w-full"
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-slate-300 font-medium">
              Nombre
            </label>
            <input
              value={roleName}
              onChange={(event) => setRoleName(event.target.value)}
              className="w-full rounded border border-slate-600 bg-slate-800 text-slate-200 px-3 py-2"
              placeholder="ADMIN"
            />
          </div>
          <div>
            <label className="block mb-1 text-slate-300 font-medium">
              Descripción
            </label>
            <input
              value={roleDescription}
              onChange={(event) => setRoleDescription(event.target.value)}
              className="w-full rounded border border-slate-600 bg-slate-800 text-slate-200 px-3 py-2"
              placeholder="Rol administrador"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={closeRoleEditor}
              disabled={isSavingRole}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={!roleName.trim() || isSavingRole}
            >
              Guardar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isPermissionsModalOpen}
        onClose={closePermissionsModal}
        title={`Permisos del rol ${selectedRoleForPermissions?.name ?? ""}`}
        className="max-w-lg w-full"
      >
        <div className="space-y-4">
          {permissionsLoading ? (
            <div className="text-sm text-slate-400">Cargando permisos...</div>
          ) : (
            <SelectInput
              value={selectedPermissionIds.map(String)}
              onChange={(value) => {
                const values = (value as string[]).map((item) => Number(item));
                setSelectedPermissionIds(
                  values.filter((item) => Number.isFinite(item)),
                );
              }}
              options={permissionOptions}
              inputLabel="Permisos"
              placeholder="Selecciona permisos"
              isMulti
            />
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={closePermissionsModal}
              disabled={isSavingPermissions}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveRolePermissions}
              disabled={isSavingPermissions}
            >
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
