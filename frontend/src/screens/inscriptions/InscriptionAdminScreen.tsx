import { useEffect, useMemo, useState } from "react";
import { getEvents, Evento } from "../../services/eventsServices";
import {
    getInscriptions,
    updateInscriptionStatus,
    InscriptionItem,
} from "../../services/inscriptionServices";
import Loader from "../../components/ui/Loader";
import ErrorState from "../../components/ui/ErrorState";
import Modal from "../../components/ui/Modal";
import Button from "../../components/ui/Button";
import SelectInput from "../../components/ui/SelectorInput";
import Input from "../../components/ui/Input";
import { useToast } from "../../contexts/Toast/ToastContext";

const statusOptions = [
    { value: "Pendiente", label: "Pendiente" },
    { value: "Pagado", label: "Pagado" },
    { value: "Aprobado", label: "Aprobado" },
    { value: "Rechazado", label: "Rechazado" },
];

function getAuthUser() {
    const raw = localStorage.getItem("auth-user");
    if (!raw) return null;
    try {
        return JSON.parse(raw) as { id: number; name: string; email: string; role: string };
    } catch {
        return null;
    }
}

export default function InscriptionAdminScreen(): JSX.Element {
    const [rows, setRows] = useState<InscriptionItem[]>([]);
    const [events, setEvents] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [statusFilter, setStatusFilter] = useState("");
    const [eventFilter, setEventFilter] = useState("");
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<InscriptionItem | null>(null);
    const [newStatus, setNewStatus] = useState("");
    const [note, setNote] = useState("");
    const { showToast } = useToast();

    const authUser = getAuthUser();

    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const pagedRows = useMemo(() => {
        const start = (page - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, page, pageSize]);

    const eventOptions = useMemo(() => {
        return events.map((ev) => ({ value: String(ev.id_evento), label: ev.nombre }));
    }, [events]);

    const loadData = async () => {
        setLoading(true);
        setError("");

        const [insRes, evRes] = await Promise.all([
            getInscriptions({
                estado: statusFilter || undefined,
                evento_id: eventFilter || undefined,
                q: query || undefined,
            }),
            getEvents(),
        ]);

        if (insRes.status >= 400) {
            setError("No se pudieron cargar las inscripciones.");
            setRows([]);
        } else {
            setRows(Array.isArray(insRes.data) ? insRes.data : []);
        }

        if (evRes.status === 200 && Array.isArray(evRes.data)) {
            setEvents(evRes.data);
        }

        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [statusFilter, eventFilter]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const openModal = (item: InscriptionItem) => {
        setSelected(item);
        setNewStatus(item.estado);
        setNote("");
    };

    const closeModal = () => {
        setSelected(null);
        setNewStatus("");
        setNote("");
    };

    const handleUpdate = async () => {
        if (!selected || !newStatus) return;
        const { status, data } = await updateInscriptionStatus({
            id_inscripcion: selected.id_inscripcion,
            estado: newStatus,
            nota: note,
            actor: authUser?.email || "admin",
        });

        if (status >= 400) {
            showToast({
                title: "Error",
                message: data?.message || "No se pudo actualizar el estado.",
                status: "error",
            });
            return;
        }

        showToast({
            title: "Estado actualizado",
            message: "Se actualizó el estado de la inscripción.",
            status: "success",
        });
        closeModal();
        loadData();
    };

    return (
        <section className="space-y-6 bg-slate-900 min-h-screen px-4 py-8">
            <header>
                <h1 className="text-2xl font-semibold text-[#F5E427]">Gestión de inscripciones</h1>
                <p className="text-slate-300">Revisa y actualiza el estado de los usuarios inscritos.</p>
            </header>

            <div className="grid gap-4 lg:grid-cols-3">
                <SelectInput
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={statusOptions}
                    inputLabel="Filtrar por estado"
                    placeholder="Todos"
                    allowCustom={false}
                />
                <SelectInput
                    value={eventFilter}
                    onChange={setEventFilter}
                    options={eventOptions}
                    inputLabel="Filtrar por evento"
                    placeholder="Todos"
                    allowCustom={false}
                />
                <div>
                    <label className="block mb-1 text-slate-300 font-medium">Buscar</label>
                    <Input
                        placeholder="Nombre, correo o evento"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <Button onClick={loadData}>Aplicar filtros</Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center min-h-[200px] pt-16">
                    <Loader visible={true} />
                </div>
            ) : error ? (
                <ErrorState
                    title="Error al cargar"
                    description={error}
                    buttonText="Volver a intentar"
                    onRetry={loadData}
                />
            ) : (
                <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/80">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900 text-slate-200">
                            <tr>
                                <th className="px-4 py-3">Evento</th>
                                <th className="px-4 py-3">Participante</th>
                                <th className="px-4 py-3">Correo</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700 text-slate-300">
                            {pagedRows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-6 text-center">
                                        Sin inscripciones.
                                    </td>
                                </tr>
                            ) : (
                                pagedRows.map((row) => (
                                    <tr key={row.id_inscripcion}>
                                        <td className="px-4 py-3">{row.evento_nombre}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                className="text-[#F5E427] hover:underline"
                                                onClick={() => openModal(row)}
                                            >
                                                {row.nombre_participante}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">{row.email}</td>
                                        <td className="px-4 py-3">{row.estado}</td>
                                        <td className="px-4 py-3">{row.fecha_inscripcion}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {!loading && rows.length > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
                    <span>
                        Página {page} de {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            className="rounded-md border border-slate-600 px-3 py-1 text-slate-200 transition hover:border-[#F5E427] hover:text-[#F5E427] disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                            disabled={page <= 1}
                        >
                            Anterior
                        </button>
                        <button
                            className="rounded-md border border-slate-600 px-3 py-1 text-slate-200 transition hover:border-[#F5E427] hover:text-[#F5E427] disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={page >= totalPages}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            ) : null}

            <Modal
                open={!!selected}
                onClose={closeModal}
                title="Actualizar inscripción"
                className="max-w-lg"
            >
                {selected && (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200">
                            <p className="font-semibold">{selected.nombre_participante}</p>
                            <p>{selected.email}</p>
                            <p className="text-slate-400">{selected.evento_nombre}</p>
                            <p className="text-slate-400">Estado actual: {selected.estado}</p>
                            <p className="text-slate-400">Fecha inscripción: {selected.fecha_inscripcion}</p>
                        </div>
                        <SelectInput
                            value={newStatus}
                            onChange={setNewStatus}
                            options={statusOptions}
                            inputLabel="Nuevo estado"
                            placeholder="Selecciona"
                            allowCustom={false}
                        />
                        <Input
                            label="Notas"
                            placeholder="Comentario"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <Button className="w-full" onClick={handleUpdate}>
                                Guardar
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full border border-slate-600"
                                onClick={closeModal}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </section>
    );
}
