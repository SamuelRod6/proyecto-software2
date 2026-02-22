import { useEffect, useMemo, useState } from "react";
import { getEvents, Evento } from "../../services/eventsServices";
import {
    downloadReport,
    getReports,
    ReporteResponse,
} from "../../services/inscriptionServices";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import SelectInput from "../../components/ui/SelectorInput";
import Loader from "../../components/ui/Loader";
import { useToast } from "../../contexts/Toast/ToastContext";

const statusOptions = [
    { value: "", label: "Todos" },
    { value: "Pendiente", label: "Pendiente" },
    { value: "Pagado", label: "Pagado" },
    { value: "Aprobado", label: "Aprobado" },
    { value: "Rechazado", label: "Rechazado" },
];


export default function InscriptionReportsScreen(): JSX.Element {
    const [events, setEvents] = useState<Evento[]>([]);
    const [report, setReport] = useState<ReporteResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [eventoId, setEventoId] = useState("");
    const [estado, setEstado] = useState("");
    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");
    const { showToast } = useToast();

    const eventOptions = useMemo(() => {
        return events.map((ev) => ({ value: String(ev.id_evento), label: ev.nombre }));
    }, [events]);

    const loadReport = async () => {
        setLoading(true);
        const { status, data } = await getReports({
            evento_id: eventoId || undefined,
            estado: estado || undefined,
            desde: desde || undefined,
            hasta: hasta || undefined,
        });
        if (status >= 400) {
            showToast({
                title: "Error",
                message: "No se pudo generar el reporte.",
                status: "error",
            });
            setReport(null);
        } else {
            setReport(data as ReporteResponse);
        }
        setLoading(false);
    };

    useEffect(() => {
        const loadEvents = async () => {
            const { status, data } = await getEvents();
            if (status === 200 && Array.isArray(data)) {
                setEvents(data);
            }
        };
        loadEvents();
        loadReport();
    }, []);

    const handleDownload = async (format: "csv" | "pdf") => {
        const { status, data } = await downloadReport(
            {
                evento_id: eventoId || undefined,
                estado: estado || undefined,
                desde: desde || undefined,
                hasta: hasta || undefined,
            },
            format,
        );
        if (status >= 400) {
            showToast({
                title: "Error",
                message: "No se pudo descargar el reporte.",
                status: "error",
            });
            return;
        }
        const blob = data as Blob;
        if (blob?.type?.includes("application/json")) {
            const text = await blob.text();
            let message = "No se pudo generar el reporte.";
            try {
                message = text ? JSON.parse(text)?.message || message : message;
            } catch {
                message = text || message;
            }
            showToast({
                title: "Error",
                message: message || "No se pudo generar el reporte.",
                status: "error",
            });
            return;
        }
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `reporte_inscripciones.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);
    };


    return (
        <section className="space-y-6 bg-slate-900 min-h-screen px-4 py-8">
            <header>
                <h1 className="text-2xl font-semibold text-[#F5E427]">Reportes de inscripciones</h1>
                <p className="text-slate-300">Genera reportes por estado o fecha.</p>
            </header>

            <div className="grid gap-4 lg:grid-cols-4">
                <SelectInput
                    value={eventoId}
                    onChange={setEventoId}
                    options={[{ value: "", label: "Todos" }, ...eventOptions]}
                    inputLabel="Evento"
                    placeholder="Todos"
                    allowCustom={false}
                />
                <SelectInput
                    value={estado}
                    onChange={setEstado}
                    options={statusOptions}
                    inputLabel="Estado"
                    placeholder="Todos"
                    allowCustom={false}
                />
                <Input
                    label="Desde"
                    placeholder="DD/MM/AAAA"
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                />
                <Input
                    label="Hasta"
                    placeholder="DD/MM/AAAA"
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                />
                <Button onClick={loadReport}>Generar reporte</Button>
                <Button variant="ghost" onClick={() => handleDownload("csv")}>Exportar CSV</Button>
                <Button variant="ghost" onClick={() => handleDownload("pdf")}>Exportar PDF</Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center min-h-[160px]">
                    <Loader visible={true} />
                </div>
            ) : report ? (
                <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-6">
                    <h2 className="text-lg font-semibold text-[#F5E427]">Resumen</h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-400">Total inscritos</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-100">{report.total}</p>
                        </div>
                        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-400">% Pagados</p>
                            <p className="mt-2 text-2xl font-semibold text-emerald-300">
                                {report.total > 0
                                    ? (((report.por_estado?.Pagado || 0) + (report.por_estado?.Aprobado || 0)) * 100 / report.total).toFixed(1)
                                    : "0"}%
                            </p>
                        </div>
                        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-400">Estados</p>
                            <div className="mt-2 space-y-1 text-sm text-slate-200">
                                {Object.entries(report.por_estado || {}).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between">
                                        <span>{key}</span>
                                        <span className="font-semibold">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

        </section>
    );
}
