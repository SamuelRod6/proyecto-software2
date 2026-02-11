import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../contexts/Toast/ToastContext";
import Modal from "../../components/ui/Modal";
import SelectInput, { OptionType } from "../../components/ui/SelectorInput";
import Button from "../../components/ui/Button";

type UserRoleRow = {
	id: number;
	name: string;
	role: string;
};

const PAGE_SIZE = 10;
const USERS_ENDPOINT = "/api/users";
const ROLES_ENDPOINT = "/api/roles";
const UPDATE_ROLE_ENDPOINT = "/api/admin/assign-role";

function normalizeUsers(payload: unknown): UserRoleRow[] {
	const list = Array.isArray(payload)
		? payload
		: (payload as { users?: unknown; data?: unknown })?.users ??
			(payload as { data?: unknown })?.data ??
			(payload as { payload?: { users?: unknown; data?: unknown } })?.payload?.users ??
			(payload as { payload?: { data?: unknown } })?.payload?.data;

	if (!Array.isArray(list)) {
		return [];
	}

	return list.map((item, index) => {
		const record = item as Record<string, unknown>;
		const id = Number(record.id ?? record.id_usuario ?? index + 1);
		const name = String(record.name ?? record.nombre ?? record.email ?? "Usuario");
		const role = String(record.role ?? record.rol ?? record.nombre_rol ?? "Rol");
		return { id, name, role };
	});
}

function normalizeRoles(payload: unknown): OptionType[] {
	const list = Array.isArray(payload)
		? payload
		: (payload as { roles?: unknown; data?: unknown })?.roles ??
			(payload as { payload?: { roles?: unknown; data?: unknown } })?.payload?.roles ??
			(payload as { data?: unknown })?.data;

	if (!Array.isArray(list)) {
		return [];
	}

	return list.map((item) => {
		const record = item as Record<string, unknown>;
		const value = String(record.name ?? record.nombre_rol ?? "");
		return {
			value,
			label: value || "Rol",
		};
	});
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
	const canUpdate = selectedUser && selectedRole && selectedRole !== selectedUser.role;

	const roleNames = useMemo(
		() => new Set(roleOptions.map((option) => option.value)),
		[roleOptions]
	);

	useEffect(() => {
		let isActive = true;
		setIsLoading(true);
		setError("");

		const params = new URLSearchParams({
			limit: String(PAGE_SIZE),
			offset: String(offset),
		});

		fetch(`${USERS_ENDPOINT}?${params.toString()}`)
			.then((res) => {
				if (!res.ok) {
					throw new Error("Request failed");
				}
				return res.json();
			})
			.then((data) => {
				if (!isActive) {
					return;
				}
				setRows(normalizeUsers(data));
				const totalValue = Number(
					(data as { total?: unknown })?.total ??
						(data as { payload?: { total?: unknown } })?.payload?.total ??
						0
				);
				setTotal(Number.isFinite(totalValue) ? totalValue : 0);
			})
			.catch(() => {
				if (isActive) {
					setError("No se pudo cargar usuarios.");
				}
			})
			.finally(() => {
				if (isActive) {
					setIsLoading(false);
				}
			});

		return () => {
			isActive = false;
		};
	}, [offset]);

	const loadRoles = () => {
		if (roleOptions.length > 0 || rolesLoading) {
			return;
		}
		setRolesLoading(true);
		fetch(ROLES_ENDPOINT)
			.then((res) => {
				if (!res.ok) {
					throw new Error("Request failed");
				}
				return res.json();
			})
			.then((data) => {
				setRoleOptions(normalizeRoles(data));
			})
			.catch(() => {
				showToast({
					title: "Error",
					message: "No se pudo cargar los roles.",
					status: "error",
				});
			})
			.finally(() => {
				setRolesLoading(false);
			});
	};

	const openRoleModal = (user: UserRoleRow) => {
		setSelectedUser(user);
		setSelectedRole(user.role);
		setIsModalOpen(true);
		loadRoles();
	};

	const closeRoleModal = () => {
		setIsModalOpen(false);
		setSelectedUser(null);
		setSelectedRole("");
	};

	const handleUpdateRole = async () => {
		if (!selectedUser || !selectedRole) {
			return;
		}
		if (roleNames.size > 0 && !roleNames.has(selectedRole)) {
			showToast({
				title: "Rol invalido",
				message: "Selecciona un rol valido de la lista.",
				status: "error",
			});
			return;
		}

		setIsUpdating(true);
		try {
			const response = await fetch(UPDATE_ROLE_ENDPOINT, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					"X-Role": "ADMIN",
				},
				body: JSON.stringify({
					user_id: selectedUser.id,
					rol: selectedRole,
				}),
			});

			if (!response.ok) {
				throw new Error("Request failed");
			}

			setRows((prev) =>
				prev.map((row) =>
					row.id === selectedUser.id
						? { ...row, role: selectedRole }
						: row
				)
			);
			showToast({
				title: "Rol actualizado",
				message: "El rol del usuario se actualizo correctamente.",
				status: "success",
			});
			closeRoleModal();
		} catch (err) {
			showToast({
				title: "Error",
				message: "No se pudo actualizar el rol del usuario.",
				status: "error",
			});
		} finally {
			setIsUpdating(false);
		}
	};

	return (
		<section className="space-y-6 bg-slate-900 min-h-screen px-4 py-8">
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
					Pagina {page} de {totalPages}
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
						<span className="font-semibold text-slate-100">
							{selectedUser?.name}
						</span>
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
		</section>
	);
}