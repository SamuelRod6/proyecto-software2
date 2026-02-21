import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import SelectInput, { OptionType } from "../../components/ui/SelectorInput";
import { RESOURCE_DEFINITIONS } from "../../constants/resources";
import { useToast } from "../../contexts/Toast/ToastContext";
import {
  createPermission,
  deletePermission,
  getPermissions,
  updatePermission,
} from "../../services/roleServices";
import {
  getResourcePermissionMap,
  setResourcePermissionMap,
} from "../../utils/accessControl";

type PermissionRow = {
  id: number;
  name: string;
  resource?: string;
};

const normalizePermissions = (payload: unknown): PermissionRow[] => {
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
};

export default function PermissionManagementScreen(): JSX.Element {
  const { showToast } = useToast();

  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [resourcePermissionMap, setResourcePermissionMapState] = useState<
    Record<string, number>
  >({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] =
    useState<PermissionRow | null>(null);
  const [permissionName, setPermissionName] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);

    const perms = await getPermissions();
    if (perms.status < 400) {
      setPermissions(normalizePermissions(perms.data));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setResourcePermissionMapState(getResourcePermissionMap());
  }, []);

  const openCreate = () => {
    setEditingPermission(null);
    setPermissionName("");
    setIsModalOpen(true);
  };

  const openEdit = (permission: PermissionRow) => {
    setEditingPermission(permission);
    setPermissionName(permission.name);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPermission(null);
    setPermissionName("");
  };

  const handleSave = async () => {
    if (!permissionName.trim()) return;

    const payload = {
      name: permissionName.trim(),
    };

    const result = editingPermission
      ? await updatePermission(editingPermission.id, payload)
      : await createPermission(payload);

    if (result.status >= 400) {
      showToast({
        title: "Error",
        message: "No se pudo guardar el permiso.",
        status: "error",
      });
      return;
    }

    await loadData();
    showToast({
      title: "Permiso guardado",
      message: "El permiso se guardó correctamente.",
      status: "success",
    });
    closeModal();
  };

  const handleDelete = async (permission: PermissionRow) => {
    const result = await deletePermission(permission.id);
    if (result.status >= 400) {
      showToast({
        title: "Error",
        message: "No se pudo eliminar el permiso.",
        status: "error",
      });
      return;
    }
    setPermissions((prev) => prev.filter((item) => item.id !== permission.id));
    const nextMap = { ...resourcePermissionMap };
    let updated = false;
    Object.entries(nextMap).forEach(([resourceKey, permissionId]) => {
      if (permissionId === permission.id) {
        delete nextMap[resourceKey];
        updated = true;
      }
    });
    if (updated) {
      setResourcePermissionMapState(nextMap);
      setResourcePermissionMap(nextMap);
    }
    showToast({
      title: "Permiso eliminado",
      message: "El permiso se eliminó correctamente.",
      status: "success",
    });
  };

  const permissionOptions: OptionType[] = useMemo(() => {
    const base = permissions.map((permission) => ({
      value: String(permission.id),
      label: permission.name,
    }));
    return [{ value: "none", label: "Sin permiso" }, ...base];
  }, [permissions]);

  const handleResourcePermissionChange = (
    resourceKey: string,
    value: string | string[],
  ) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    const nextPermissionId = Number(nextValue);
    const nextMap = { ...resourcePermissionMap };

    if (!Number.isFinite(nextPermissionId)) {
      delete nextMap[resourceKey];
    } else {
      nextMap[resourceKey] = nextPermissionId;
    }

    setResourcePermissionMapState(nextMap);
    setResourcePermissionMap(nextMap);
    showToast({
      title: "Recurso actualizado",
      message: "Permiso asignado correctamente.",
      status: "success",
    });
  };

  return (
    <section className="space-y-6 bg-slate-900 min-h-screen px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#F5E427]">
            Gestión de permisos y recursos
          </h1>
          <p className="text-slate-300">
            Crea permisos y vincula recursos con un permiso obligatorio.
          </p>
        </div>
        <Button onClick={openCreate}>Crear permiso</Button>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/80">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">Permiso</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 text-slate-300">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={2}>
                  Cargando permisos...
                </td>
              </tr>
            ) : permissions.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={2}>
                  Sin permisos.
                </td>
              </tr>
            ) : (
              permissions.map((permission) => (
                <tr key={permission.id}>
                  <td className="px-4 py-3">{permission.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        className="text-[#F5E427] hover:underline"
                        onClick={() => openEdit(permission)}
                      >
                        Editar
                      </button>
                      <button
                        className="text-slate-300 hover:text-red-400"
                        onClick={() => handleDelete(permission)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/80">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">Recurso</th>
              <th className="px-4 py-3 font-semibold">Permiso requerido</th>
              <th className="px-4 py-3 font-semibold">Descripcion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700 text-slate-300">
            {RESOURCE_DEFINITIONS.map((resource) => {
              const selected = resourcePermissionMap[resource.key];
              return (
                <tr key={resource.key}>
                  <td className="px-4 py-3">{resource.label}</td>
                  <td className="px-4 py-3">
                    <SelectInput
                      value={selected ? String(selected) : "none"}
                      onChange={(value) =>
                        handleResourcePermissionChange(resource.key, value)
                      }
                      options={permissionOptions}
                      placeholder="Selecciona un permiso"
                      menuPortalTarget={
                        typeof document === "undefined" ? null : document.body
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {resource.description}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingPermission ? "Editar permiso" : "Crear permiso"}
        className="max-w-md w-full"
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-slate-300 font-medium">
              Nombre
            </label>
            <input
              value={permissionName}
              onChange={(event) => setPermissionName(event.target.value)}
              className="w-full rounded border border-slate-600 bg-slate-800 text-slate-200 px-3 py-2"
              placeholder="crear_evento"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!permissionName.trim()}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
