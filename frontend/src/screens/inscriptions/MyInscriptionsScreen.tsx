import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import SelectInput from "../../components/ui/SelectorInput";
import Loader from "../../components/ui/Loader";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import emptyAnimation from "../../assets/animations/empty-animation.json";
import { useToast } from "../../contexts/Toast/ToastContext";
import {
    downloadReceipt,
    getInscriptions,
    getNotifications,
    getPreferences,
    updatePreferences,
    InscriptionItem,
    NotificacionItem,
    PreferenciasResponse,
} from "../../services/inscriptionServices";

function getAuthUser() {
    const raw = localStorage.getItem("auth-user");
    if (!raw) return null;
    try {
        return JSON.parse(raw) as { id: number; name: string; email: string; role: string };
    } catch {
        return null;
    }
}

export default function MyInscriptionsScreen(): JSX.Element {
    const [items, setItems] = useState<InscriptionItem[]>([]);
    const [notifications, setNotifications] = useState<NotificacionItem[]>([]);
    const [preferences, setPreferences] = useState<PreferenciasResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [frequency, setFrequency] = useState("inmediata");
    const [types, setTypes] = useState("estado");
    const [enabled, setEnabled] = useState(true);
    const { showToast } = useToast();

    const frequencyOptions = [
        { value: "inmediata", label: "Inmediata" },
        { value: "diaria", label: "Diaria" },
        { value: "semanal", label: "Semanal" },
    ];

    const typeOptions = [{ value: "estado", label: "Cambios de estado" }];

    const authUser = getAuthUser();

    const canLoad = authUser?.id ? authUser.id > 0 : false;

    const loadData = async () => {
        if (!canLoad) return;
        setLoading(true);
        setError("");

        const [insRes, prefRes, notifRes] = await Promise.all([
            getInscriptions({ user_id: authUser?.id }),
            getPreferences(authUser!.id),
            getNotifications(authUser!.id),
        ]);

        if (insRes.status >= 400) {
            setError("No se pudo cargar tus inscripciones.");
            setItems([]);
        } else {
            setItems(Array.isArray(insRes.data) ? insRes.data : []);
        }

        if (prefRes.status < 400 && prefRes.data) {
            setPreferences(prefRes.data);
            setFrequency(prefRes.data.frecuencia);
            setTypes(prefRes.data.tipos);
            setEnabled(prefRes.data.habilitado);
        }

        if (notifRes.status < 400) {
            setNotifications(Array.isArray(notifRes.data) ? notifRes.data : []);
        }

        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [canLoad]);

    const grouped = useMemo(() => items, [items]);

    const handleDownload = async (id: number) => {
        const { status, data } = await downloadReceipt(id);
        if (status >= 400) {
            showToast({
                title: "Error",
                message: "No se pudo descargar el comprobante.",
                status: "error",
            });
            return;
        }
        const blob = data as Blob;
        if (blob?.type?.includes("application/json")) {
            const text = await blob.text();
            showToast({
                title: "Error",
                message: text || "No se pudo generar el comprobante.",
                status: "error",
            });
            return;
        }
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `comprobante_${id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
    };

    const handleView = async (id: number) => {
        const { status, data } = await downloadReceipt(id);
        if (status >= 400) {
            showToast({
                title: "Error",
                message: "No se pudo abrir el comprobante.",
                status: "error",
            });
            return;
        }
        const blob = data as Blob;
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => window.URL.revokeObjectURL(url), 2000);
    };

    const handleSavePreferences = async () => {
        if (!authUser?.id) return;
        const { status, data } = await updatePreferences({
            id_usuario: authUser.id,
            frecuencia: frequency.trim(),
            tipos: types.trim(),
            habilitado: enabled,
        });

        if (status >= 400) {
            showToast({
                title: "Error",
                message: data?.message || "No se pudo guardar preferencias.",
                status: "error",
            });
            return;
        }

        setPreferences(data);
        showToast({
            title: "Preferencias actualizadas",
            message: "Tus preferencias de notificación fueron guardadas.",
            status: "success",
        });
    };

    return (
        <section className="space-y-6 bg-slate-900 min-h-screen px-4 py-8">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-[#F5E427]">Mis inscripciones</h1>
                    <p className="text-slate-300">Consulta tu estado y comprobantes.</p>
                </div>
            </header>

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
            ) : grouped.length === 0 ? (
                <EmptyState
                    title="Aún no tienes inscripciones"
                    description="Cuando te inscribas a un evento, aparecerá aquí."
                    animationData={emptyAnimation}
                />
            ) : (
                <div className="grid gap-4">
                    {grouped.map((item) => (
                        <div key={item.id_inscripcion} className="rounded-lg border border-slate-700 bg-slate-800/80 p-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-[#F5E427]">{item.evento_nombre}</h3>
                                    <p className="text-sm text-slate-300">Inscrito el {item.fecha_inscripcion}</p>
                                </div>
                                <span className="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-200">
                                    {item.estado}
                                </span>
                            </div>
                            <div className="mt-4 text-sm text-slate-300">
                                Fecha límite de pago: {item.fecha_limite_pago}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-3">
                                <Button onClick={() => handleDownload(item.id_inscripcion)}>Descargar comprobante</Button>
                                <Button variant="ghost" onClick={() => handleView(item.id_inscripcion)}>Ver comprobante</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-6">
                    <h2 className="text-lg font-semibold text-[#F5E427]">Preferencias de notificación</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Elige cómo y cuándo quieres recibir avisos sobre tu inscripción.
                    </p>
                    <div className="mt-4 grid gap-3">
                        <SelectInput
                            value={frequency}
                            onChange={setFrequency}
                            options={frequencyOptions}
                            inputLabel="Frecuencia"
                            placeholder="Selecciona"
                            allowCustom={false}
                        />
                        <SelectInput
                            value={types}
                            onChange={setTypes}
                            options={typeOptions}
                            inputLabel="Tipos de cambios"
                            placeholder="Selecciona"
                            allowCustom={false}
                        />
                        <label className="flex items-center gap-2 text-sm text-slate-200">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                            />
                            Recibir notificaciones
                        </label>
                        <Button onClick={handleSavePreferences}>Guardar preferencias</Button>
                    </div>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-6">
                    <h2 className="text-lg font-semibold text-[#F5E427]">Historial de notificaciones</h2>
                    <div className="mt-4 space-y-3">
                        {notifications.length === 0 ? (
                            <p className="text-sm text-slate-400">Sin notificaciones.</p>
                        ) : (
                            notifications.slice(0, 6).map((notif) => (
                                <div key={notif.id_notificacion} className="rounded-md border border-slate-700 bg-slate-900/60 p-3">
                                    <p className="text-sm font-semibold text-slate-200">{notif.asunto}</p>
                                    <p className="text-xs text-slate-400">{notif.fecha_envio}</p>
                                    <p className="mt-1 text-sm text-slate-300">{notif.mensaje}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
