import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "../../contexts/Toast/ToastContext";
import Modal from "../../components/ui/Modal";
import SelectInput, { OptionType } from "../../components/ui/SelectorInput";
import Button from "../../components/ui/Button";
import {
    getRoles,
    getUsers,
    updateUserRole,
} from "../../services/roleServices";

type UserRoleRow = {
    id: number;
    name: string;
    role: string;
};

const PAGE_SIZE = 10;

function normalizeUsers(payload: unknown): UserRoleRow[] {
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

function normalizeRoles(payload: unknown): OptionType[] {
    const root = (payload as { payload?: unknown })?.payload ?? payload;
    const list = Array.isArray(root)
        ? root
        : (root as { roles?: unknown; data?: unknown })?.roles ??
            (root as { data?: unknown })?.data;

    if (!Array.isArray(list)) return [];

    return list.map((item) => {
        const record = item as Record<string, unknown>;
        const name = String(record.name ?? record.nombre_rol ?? "");
        return { value: name, label: name || "Rol" };
    });
}

function extractTotal(payload: unknown): number {
    const root = (payload as { payload?: unknown })?.payload ?? payload;
    const raw = (root as { total?: unknown })?.total ?? 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
}

export default function RoleManagementListScreen(): JSX.Element {
    const [rows, setRows] = useState<UserRoleRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserRoleRow | null>(null);
    const [roleOptions, setRoleOptions] = useState<OptionType[]>([]);
    const [selectedRole, setSelectedRole] = useState("");
    const [rolesLoading, setRolesLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const { showToast } = useToast();

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const offset = (page - 1) * PAGE_SIZE;
    const canUpdate = Boolean(
        selectedUser && selectedRole && selectedRole !== selectedUser.role
    );

    const roleNames = useMemo(
        () => new Set(roleOptions.map((option) => option.value)),
        [roleOptions]
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

        setRoleOptions(normalizeRoles(data));
        setRolesLoading(false);
    }, [roleOptions.length, rolesLoading, showToast]);

    const openRoleModal = (user: UserRoleRow) => {
        setSelectedUser(user);
        setSelectedRole(user.role);
        setIsModalOpen(true);
        void loadRoles();
    };

    const closeRoleModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
        setSelectedRole("");
    };

    const handleUpdateRole = async () => {
        if (!selectedUser || !selectedRole) return;

        if (roleNames.size > 0 && !roleNames.has(selectedRole)) {
            showToast({
                title: "Rol inválido",
                message: "Selecciona un rol válido de la lista.",
                status: "error",
            });
            return;
        }

        setIsUpdating(true);

        const { status } = await updateUserRole({
            user_id: selectedUser.id,
            rol: selectedRole,
        });

        if (status >= 400) {
            showToast({
                title: "Error",
                message: "No se pudo actualizar el rol del usuario.",
                status: "error",
            });
            setIsUpdating(false);
            return;
        }

        setRows((prev) =>
            prev.map((row) =>
                row.id === selectedUser.id ? { ...row, role: selectedRole } : row
            )
        );

        showToast({
            title: "Rol actualizado",
            message: "El rol del usuario se actualizó correctamente.",
            status: "success",
        });

        closeRoleModal();
        setIsUpdating(false);
    };

    return (
        <section className="space-y-6 bg-slate-900 min-h-screen px-4 py-8">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-[#F5E427]">Roles de usuario</h1>
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
                            <th className="px-4 py-3 font-semibold">Rol</th>
                            <th className="px-4 py-3 font-semibold">Permisos</th>
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
                                    <td className="px-4 py-3">
                                        <button
                                            className="text-[#F5E427] hover:underline"
                                            onClick={() => openRoleModal(row)}
                                        >
                                            {row.role || "Sin rol"}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">permisos</td>
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

            <Modal
                open={isModalOpen}
                onClose={closeRoleModal}
                title="Actualizar rol"
                className="max-w-md w-full"
            >
                <div className="space-y-4">
                    <div className="text-sm text-slate-300">
                        <span className="font-semibold text-slate-100">{selectedUser?.name}</span>
                        <span className="ml-2 text-slate-400">#{selectedUser?.id}</span>
                    </div>

                    {rolesLoading ? (
                        <div className="text-sm text-slate-400">Cargando roles...</div>
                    ) : (
                        <SelectInput
                            value={selectedRole}
                            onChange={setSelectedRole}
                            options={roleOptions}
                            inputLabel="Rol"
                            placeholder="Selecciona un rol"
                            allowCustom={false}
                        />
                    )}

                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={closeRoleModal} disabled={isUpdating}>
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
        </section>
    );
}