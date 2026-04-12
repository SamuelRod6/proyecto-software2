import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Input from "../../components/ui/Input";
import Loader from "../../components/ui/Loader";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import { useToast } from "../../contexts/Toast/ToastContext";
import emptyAnimation from "../../assets/animations/empty-animation.json";
import { getStoredAuthUser } from "../../utils/accessControl";
import {
  ScientificWorkCompare,
  ScientificWorkItem,
  ScientificWorkHistoryFilters,
  ScientificWorkHistoryItem,
  ScientificWorkVersion,
  compareScientificWorkVersions,
  createScientificWork,
  downloadScientificWorkHistoryPDF,
  downloadScientificWorkVersion,
  getScientificWorkHistory,
  listScientificWorkVersions,
  listScientificWorks,
  uploadScientificWorkVersion,
} from "../../services/scientificWorkServices";
import { getEvents, Evento } from "../../services/eventsServices";

function countWords(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export default function MyScientificWorksScreen(): JSX.Element {
  const authUser = getStoredAuthUser();
  const { showToast } = useToast();

  const [works, setWorks] = useState<ScientificWorkItem[]>([]);
  const [events, setEvents] = useState<Evento[]>([]);
  const [versions, setVersions] = useState<ScientificWorkVersion[]>([]);
  const [comparison, setComparison] = useState<ScientificWorkCompare | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);

  const [selectedWork, setSelectedWork] = useState<ScientificWorkItem | null>(null);

  const [eventId, setEventId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [changeDescription, setChangeDescription] = useState("");
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [compareFrom, setCompareFrom] = useState("");
  const [compareTo, setCompareTo] = useState("");
  const [statusHistoryWorkId, setStatusHistoryWorkId] = useState<number | null>(null);
  const [statusHistoryItems, setStatusHistoryItems] = useState<ScientificWorkHistoryItem[]>([]);
  const [statusHistoryLoading, setStatusHistoryLoading] = useState(false);
  const [statusHistoryError, setStatusHistoryError] = useState("");
  const [statusHistoryEstadoFilter, setStatusHistoryEstadoFilter] = useState("");
  const [statusHistoryTypeFilter, setStatusHistoryTypeFilter] = useState("");
  const [statusHistoryQuery, setStatusHistoryQuery] = useState("");
  const [statusHistoryDesde, setStatusHistoryDesde] = useState("");
  const [statusHistoryHasta, setStatusHistoryHasta] = useState("");

  const summaryWords = useMemo(() => countWords(summary), [summary]);

  const statusHistoryFilters = useMemo<ScientificWorkHistoryFilters>(
    () => ({
      estado: statusHistoryEstadoFilter.trim() || undefined,
      tipo_cambio: statusHistoryTypeFilter.trim() || undefined,
      q: statusHistoryQuery.trim() || undefined,
      desde: statusHistoryDesde ? toApiDate(statusHistoryDesde) : undefined,
      hasta: statusHistoryHasta ? toApiDate(statusHistoryHasta) : undefined,
    }),
    [
      statusHistoryDesde,
      statusHistoryEstadoFilter,
      statusHistoryHasta,
      statusHistoryQuery,
      statusHistoryTypeFilter,
    ],
  );

  async function loadData() {
    if (!authUser?.id) return;
    setLoading(true);
    setError("");

    const [worksRes, eventsRes] = await Promise.all([
      listScientificWorks(authUser.id),
      getEvents(),
    ]);

    if (worksRes.status >= 400) {
      setError(worksRes.data?.message || "No se pudieron cargar tus trabajos científicos.");
      setWorks([]);
    } else {
      setWorks(Array.isArray(worksRes.data) ? worksRes.data : []);
    }

    if (eventsRes.status === 200 && Array.isArray(eventsRes.data)) {
      setEvents(eventsRes.data);
    } else {
      setEvents([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadData();
  }, []);

  function toApiDate(value: string): string {
    if (!value.includes("-")) return value;
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  }

  async function loadStatusHistory(workId: number, filtersOverride?: ScientificWorkHistoryFilters) {
    if (!authUser?.id) return;
    setStatusHistoryLoading(true);
    setStatusHistoryError("");

    const { status, data } = await getScientificWorkHistory(
      workId,
      authUser.id,
      filtersOverride ?? statusHistoryFilters,
    );

    if (status >= 400 || !Array.isArray(data)) {
      setStatusHistoryItems([]);
      setStatusHistoryError("No se pudo cargar el historial de cambios de estado.");
    } else {
      setStatusHistoryItems(data);
    }

    setStatusHistoryLoading(false);
  }

  async function openHistory(work: ScientificWorkItem) {
    if (!authUser?.id) return;
    setSelectedWork(work);
    const res = await listScientificWorkVersions(work.id_trabajo, authUser.id);
    if (res.status >= 400) {
      showToast({
        title: "Error",
        message: res.data?.message || "No se pudo cargar el historial de versiones.",
        status: "error",
      });
      return;
    }
    setVersions(Array.isArray(res.data) ? res.data : []);
    setComparison(null);
    setCompareFrom("");
    setCompareTo("");
    setStatusHistoryWorkId(work.id_trabajo);
    setStatusHistoryEstadoFilter("");
    setStatusHistoryTypeFilter("");
    setStatusHistoryQuery("");
    setStatusHistoryDesde("");
    setStatusHistoryHasta("");
    await loadStatusHistory(work.id_trabajo, {});
    setHistoryOpen(true);
  }

  async function handleSearchStatusHistory() {
    if (!statusHistoryWorkId) return;
    await loadStatusHistory(statusHistoryWorkId);
  }

  async function handleDownloadStatusHistoryPDF() {
    if (!statusHistoryWorkId || !authUser?.id) return;

    const { status, data } = await downloadScientificWorkHistoryPDF(
      statusHistoryWorkId,
      authUser.id,
      statusHistoryFilters,
    );
    if (status >= 400) {
      showToast({
        title: "Error",
        message: "No se pudo descargar el historial de cambios en PDF.",
        status: "error",
      });
      return;
    }

    const blob = data as Blob;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `historial_trabajo_cientifico_${statusHistoryWorkId}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  function handlePrintStatusHistory() {
    const printWindow = globalThis.open("", "_blank", "width=1000,height=700");
    if (!printWindow) {
      showToast({
        title: "Error",
        message: "No se pudo abrir la vista de impresión.",
        status: "error",
      });
      return;
    }

    const rowsMarkup =
      statusHistoryItems.length === 0
        ? `<tr><td colspan="5">Sin resultados.</td></tr>`
        : statusHistoryItems
            .map(
              (item) =>
                `<tr>
                  <td>${item.fecha_cambio}</td>
                  <td>${item.estado_anterior || "-"}</td>
                  <td>${item.estado_nuevo}</td>
                  <td>${item.tipo_cambio || "-"}</td>
                  <td>${item.nota || ""}</td>
                </tr>`,
            )
            .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Historial de cambios de estado</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
            h1 { font-size: 20px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #e2e8f0; }
          </style>
        </head>
        <body>
          <h1>Historial de cambios de estado</h1>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Estado anterior</th>
                <th>Estado nuevo</th>
                <th>Tipo de cambio</th>
                <th>Comentario</th>
              </tr>
            </thead>
            <tbody>${rowsMarkup}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function handleCreateWork() {
    if (!authUser?.id) return;

    if (title.trim().length < 10 || title.trim().length > 100) {
      showToast({ title: "Validación", message: "El título debe tener entre 10 y 100 caracteres.", status: "error" });
      return;
    }
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/.test(title.trim())) {
      showToast({ title: "Validación", message: "El título solo puede contener letras y espacios.", status: "error" });
      return;
    }
    if (summaryWords < 100 || summaryWords > 500) {
      showToast({ title: "Validación", message: "El resumen debe tener entre 100 y 500 palabras.", status: "error" });
      return;
    }
    if (!acknowledged) {
      showToast({ title: "Validación", message: "Debes confirmar que no incluyes información confidencial.", status: "error" });
      return;
    }
    if (!file) {
      showToast({ title: "Validación", message: "Debes adjuntar un PDF.", status: "error" });
      return;
    }
    if (file.type !== "application/pdf") {
      showToast({ title: "Validación", message: "El archivo debe ser PDF.", status: "error" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast({ title: "Validación", message: "El PDF no puede superar los 10 MB.", status: "error" });
      return;
    }

    const payload = new FormData();
    payload.append("id_evento", eventId);
    payload.append("id_usuario", String(authUser.id));
    payload.append("titulo", title.trim());
    payload.append("resumen", summary.trim());
    payload.append("declara_no_confidencial", String(acknowledged));
    payload.append("descripcion_cambios", "Versión inicial del trabajo científico");
    payload.append("archivo", file);

    const res = await createScientificWork(payload);
    if (res.status >= 400) {
      showToast({
        title: "Error",
        message: res.data?.message || "No se pudo registrar el trabajo científico.",
        status: "error",
      });
      return;
    }

    showToast({
      title: "Trabajo recibido",
      message: "El trabajo científico fue registrado correctamente.",
      status: "success",
    });

    setCreateOpen(false);
    setEventId("");
    setTitle("");
    setSummary("");
    setAcknowledged(false);
    setFile(null);
    await loadData();
  }

  async function handleUploadVersion() {
    if (!authUser?.id || !selectedWork) return;
    if (!newVersionFile) {
      showToast({ title: "Validación", message: "Debes seleccionar un PDF.", status: "error" });
      return;
    }
    if (newVersionFile.type !== "application/pdf") {
      showToast({ title: "Validación", message: "El archivo debe ser PDF.", status: "error" });
      return;
    }
    if (newVersionFile.size > 10 * 1024 * 1024) {
      showToast({ title: "Validación", message: "El PDF no puede superar los 10 MB.", status: "error" });
      return;
    }
    if (changeDescription.trim().length < 10) {
      showToast({ title: "Validación", message: "Describe brevemente los cambios realizados.", status: "error" });
      return;
    }

    const payload = new FormData();
    payload.append("id_trabajo", String(selectedWork.id_trabajo));
    payload.append("id_usuario", String(authUser.id));
    payload.append("descripcion_cambios", changeDescription.trim());
    payload.append("archivo", newVersionFile);

    const res = await uploadScientificWorkVersion(payload);
    if (res.status >= 400) {
      showToast({
        title: "Error",
        message: res.data?.message || "No se pudo cargar la nueva versión.",
        status: "error",
      });
      return;
    }

    showToast({
      title: "Versión cargada",
      message: "La nueva versión fue registrada correctamente.",
      status: "success",
    });

    setVersionOpen(false);
    setChangeDescription("");
    setNewVersionFile(null);
    await loadData();
    await openHistory(selectedWork);
  }

  async function handleCompareVersions() {
    if (!authUser?.id || !selectedWork) return;
    const res = await compareScientificWorkVersions(
      selectedWork.id_trabajo,
      authUser.id,
      Number(compareFrom),
      Number(compareTo),
    );

    if (res.status >= 400) {
      showToast({
        title: "Error",
        message: res.data?.message || "No se pudo comparar las versiones.",
        status: "error",
      });
      return;
    }

    setComparison(res.data as ScientificWorkCompare);
  }

  async function handleDownload(versionId: number) {
    if (!authUser?.id) return;
    const res = await downloadScientificWorkVersion(versionId, authUser.id);
    if (res.status >= 400) {
      showToast({
        title: "Error",
        message: "No se pudo descargar el archivo.",
        status: "error",
      });
      return;
    }

    const blob = res.data as Blob;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trabajo_v${versionId}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <section className="space-y-6 bg-slate-900 min-h-screen px-4 py-8">
        <div className="flex justify-center items-center min-h-[200px] pt-16">
          <Loader visible={true} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-6 bg-slate-900 min-h-screen px-4 py-8">
        <ErrorState
          title="Error al cargar trabajos científicos"
          description="Hubo un problema al obtener tus trabajos. Intenta nuevamente."
          buttonText="Volver a intentar"
          onRetry={loadData}
        />
      </section>
    );
  }

  return (
    <section className="space-y-6 bg-slate-900 min-h-screen px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#F5E427]">
            Trabajos científicos
          </h1>
          <p className="text-slate-300">
            Envía tu trabajo, sube revisiones y consulta el historial de versiones.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          Adjuntar trabajo
        </Button>
      </header>

      {works.length === 0 ? (
        <EmptyState
          title="Aún no has enviado trabajos científicos"
          description="Cuando registres un trabajo, lo mostraremos en esta sección."
          animationData={emptyAnimation}
        />
      ) : (
        <div className="grid gap-4">
            {works.map((work) => (
              <article
                key={work.id_trabajo}
                className="rounded-xl border border-slate-700 bg-slate-800 p-5"
              >
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-slate-100">{work.titulo}</h2>
                  <p className="text-sm text-slate-300 line-clamp-4">{work.resumen}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>Versión actual: {work.version_actual}</span>
                    <span>Estado: {work.estado}</span>
                    <span>Último envío: {work.fecha_ultimo_envio || "Sin fecha"}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {work.archivo_actual && (
                      <Button variant="ghost" onClick={() => handleDownload(work.archivo_actual!.id_version)}>
                        Descargar actual
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedWork(work);
                        setVersionOpen(true);
                      }}
                    >
                      Subir revisión
                    </Button>
                    <Button onClick={() => openHistory(work)}>
                      Ver historial
                    </Button>
                  </div>
                </div>
              </article>
            ))}
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Enviar trabajo científico">
        <div className="space-y-4">
          <label className="block space-y-1 text-sm">
            <span className="text-slate-200">Evento</span>
            <select
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
            >
              <option value="">Selecciona un evento</option>
              {events.map((event) => (
                <option key={event.id_evento} value={event.id_evento}>
                  {event.nombre}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Solo letras y espacios"
            maxLength={100}
          />

          <label className="block space-y-1 text-sm">
            <span className="text-slate-200">Resumen</span>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full min-h-[220px] rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:border-[#F5E427] focus:outline-none focus:ring-2 focus:ring-[#F5E427]/30 resize-none"
              placeholder="Describe objetivos, metodología, resultados y conclusiones."
            />
            <span className={`text-xs ${summaryWords >= 100 && summaryWords <= 500 ? "text-slate-400" : "text-red-300"}`}>
              {summaryWords} palabras
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1"
            />
            <span>
              Confirmo que el resumen no contiene información confidencial o sensible.
            </span>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-slate-200">Archivo PDF</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
            />
            <span className="text-xs text-slate-400">Máximo 10 MB.</span>
          </label>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateWork}>
              Enviar trabajo
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={versionOpen} onClose={() => setVersionOpen(false)} title="Subir nueva versión">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            {selectedWork?.titulo}
          </p>

          <Input
            label="Descripción de cambios"
            value={changeDescription}
            onChange={(e) => setChangeDescription(e.target.value)}
            placeholder="Ejemplo: se ajustó la metodología y se actualizaron los resultados"
            maxLength={300}
          />

          <label className="block space-y-1 text-sm">
            <span className="text-slate-200">Nuevo PDF</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setNewVersionFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
            />
          </label>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setVersionOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUploadVersion}>
              Guardar versión
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Historial de versiones">
        <div className="space-y-5">
          <div className="grid gap-3">
            {versions.map((version) => (
              <div
                key={version.id_version}
                className="rounded-lg border border-slate-700 bg-slate-900 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-slate-100 font-medium">
                      Versión {version.numero_version} {version.es_actual ? "(actual)" : ""}
                    </div>
                    <div className="text-xs text-slate-400">{version.fecha_envio}</div>
                    <div className="text-sm text-slate-300">{version.descripcion_cambios || "Sin descripción"}</div>
                  </div>
                  <Button variant="ghost" onClick={() => handleDownload(version.id_version)}>
                    Descargar
                  </Button>
                </div>
               </div>
            ))}
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-3">
            <h3 className="text-slate-100 font-medium">Comparar versiones</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="text-slate-200">Desde</span>
                <select
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  value={compareFrom}
                  onChange={(e) => setCompareFrom(e.target.value)}
                >
                  <option value="">Selecciona versión</option>
                  {versions.map((version) => (
                    <option key={`from-${version.id_version}`} value={version.numero_version}>
                      Versión {version.numero_version}
                    </option>
                  ))}
                </select>
              </label> 

              <label className="block space-y-1 text-sm">
                <span className="text-slate-200">Hasta</span>
                <select
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                  value={compareTo}
                  onChange={(e) => setCompareTo(e.target.value)}
                >
                  <option value="">Selecciona versión</option>
                  {versions.map((version) => (
                    <option key={`to-${version.id_version}`} value={version.numero_version}>
                      Versión {version.numero_version}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleCompareVersions}>
                Comparar
              </Button>
            </div>

            {comparison && (
              <div className="rounded-md bg-slate-800 p-4">
                <div className="mb-2 text-sm font-medium text-[#F5E427]">
                  Resultado de comparación
                </div>
                <ul className="space-y-1 text-sm text-slate-300">
                  {comparison.resumen.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-slate-100 font-medium">Historial de cambios de estado</h3>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleDownloadStatusHistoryPDF}>
                  Descargar PDF
                </Button>
                <Button variant="ghost" onClick={handlePrintStatusHistory}>
                  Imprimir
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Input
                label="Estado"
                value={statusHistoryEstadoFilter}
                onChange={(e) => setStatusHistoryEstadoFilter(e.target.value)}
                placeholder="Ejemplo: ACTUALIZADO"
              />
              <Input
                label="Tipo de cambio"
                value={statusHistoryTypeFilter}
                onChange={(e) => setStatusHistoryTypeFilter(e.target.value)}
                placeholder="Ejemplo: DECISION_COMITE"
              />
              <Input
                label="Buscar"
                value={statusHistoryQuery}
                onChange={(e) => setStatusHistoryQuery(e.target.value)}
                placeholder="Comentario o estado"
              />
              <label className="flex flex-col gap-1 text-sm text-slate-200">
                Fecha desde
                <input
                  type="date"
                  className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  value={statusHistoryDesde}
                  onChange={(event) => setStatusHistoryDesde(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-200">
                Fecha hasta
                <input
                  type="date"
                  className="rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  value={statusHistoryHasta}
                  onChange={(event) => setStatusHistoryHasta(event.target.value)}
                />
              </label>
              <div className="flex items-end">
                <Button onClick={handleSearchStatusHistory}>Aplicar filtros</Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {statusHistoryLoading ? (
                <div className="flex justify-center py-8">
                  <Loader visible={true} />
                </div>
              ) : statusHistoryError ? (
                <p className="text-sm text-red-400">{statusHistoryError}</p>
              ) : (
                <table className="min-w-full text-sm text-slate-200">
                  <thead className="bg-slate-700/50 text-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-left">Estado anterior</th>
                      <th className="px-3 py-2 text-left">Estado nuevo</th>
                      <th className="px-3 py-2 text-left">Tipo de cambio</th>
                      <th className="px-3 py-2 text-left">Comentario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusHistoryItems.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-slate-400" colSpan={5}>
                          No hay cambios para los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      statusHistoryItems.map((item) => (
                        <tr key={item.id_historial} className="border-b border-slate-700/60">
                          <td className="px-3 py-2">{item.fecha_cambio}</td>
                          <td className="px-3 py-2">{item.estado_anterior || "-"}</td>
                          <td className="px-3 py-2">{item.estado_nuevo}</td>
                          <td className="px-3 py-2">{item.tipo_cambio || "-"}</td>
                          <td className="px-3 py-2">{item.nota || ""}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </section>
  );
}