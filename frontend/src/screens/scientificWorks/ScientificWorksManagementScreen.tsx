import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import Loader from "../../components/ui/Loader";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import { useToast } from "../../contexts/Toast/ToastContext";
import { getStoredAuthUser, getStoredUserRoleNames } from "../../utils/accessControl";
import {
  assignScientificWorkReviewers,
  decideScientificWork,
  downloadScientificWorkVersion,
  listScientificWorkEvaluations,
  listScientificWorkReviewers,
  listScientificWorksForCommittee,
  listScientificWorksForReviewer,
  ScientificWorkEvaluationItem,
  ScientificWorkEvaluationSummary,
  ScientificWorkManagementItem,
  ScientificWorkReviewerItem,
  submitScientificWorkEvaluation,
} from "../../services/scientificWorkServices";

function formatDecisionLabel(value: string): string {
  return String(value || "PENDIENTE_REVISION")
    .replaceAll("_", " ")
    .trim();
}

export default function ScientificWorksManagementScreen(): JSX.Element {
  const authUser = getStoredAuthUser();
  const { showToast } = useToast();

  const roles = useMemo(
    () => getStoredUserRoleNames().map((role) => role.trim().toUpperCase()),
    [authUser],
  );
  const isAdmin = roles.includes("ADMIN");
  const canCommittee = roles.includes("COMITE CIENTIFICO") || isAdmin;
  const canReviewer = roles.includes("REVISOR");

  const [mode, setMode] = useState<"COMITE" | "REVISOR">(canCommittee ? "COMITE" : "REVISOR");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [works, setWorks] = useState<ScientificWorkManagementItem[]>([]);
  const [reviewers, setReviewers] = useState<ScientificWorkReviewerItem[]>([]);
  const [evaluationSummary, setEvaluationSummary] = useState<ScientificWorkEvaluationSummary | null>(null);

  const [selectedWork, setSelectedWork] = useState<ScientificWorkManagementItem | null>(null);

  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("");
  const [autor, setAutor] = useState("");

  const [assignOpen, setAssignOpen] = useState(false);
  const [evaluationsOpen, setEvaluationsOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [evaluationOpen, setEvaluationOpen] = useState(false);

  const [selectedReviewers, setSelectedReviewers] = useState<number[]>([]);
  const [decision, setDecision] = useState("PENDIENTE_REVISION");
  const [decisionComment, setDecisionComment] = useState("");

  const [recomendacion, setRecomendacion] = useState("PENDIENTE");
  const [puntaje, setPuntaje] = useState("");
  const [fortalezas, setFortalezas] = useState("");
  const [debilidades, setDebilidades] = useState("");
  const [recomendaciones, setRecomendaciones] = useState("");

  useEffect(() => {
    if (!canCommittee && !canReviewer) {
      setLoading(false);
      setError("No tienes permisos para acceder a esta sección.");
      return;
    }
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function loadData() {
    if (!authUser?.id) return;
    setLoading(true);
    setError("");

    if (mode === "COMITE") {
      const res = await listScientificWorksForCommittee({
        userId: authUser.id,
        query: query.trim(),
        estado: estado.trim(),
        autor: autor.trim(),
      });
      if (res.status >= 400) {
        setError(res.data?.message || "No se pudo cargar la lista de trabajos.");
        setWorks([]);
      } else {
        setWorks(Array.isArray(res.data) ? res.data : []);
      }
    } else {
      const res = await listScientificWorksForReviewer(authUser.id);
      if (res.status >= 400) {
        setError(res.data?.message || "No se pudo cargar la lista de trabajos asignados.");
        setWorks([]);
      } else {
        setWorks(Array.isArray(res.data) ? res.data : []);
      }
    }

    setLoading(false);
  }

  async function handleFilter() {
    await loadData();
  }

  function toggleReviewer(id: number) {
    setSelectedReviewers((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  async function openAssignModal(work: ScientificWorkManagementItem) {
    if (!authUser?.id) return;
    setSelectedWork(work);
    setSelectedReviewers([]);

    const res = await listScientificWorkReviewers(authUser.id);
    if (res.status >= 400) {
      showToast({
        title: "Error",
        message: res.data?.message || "No se pudo cargar la lista de revisores.",
        status: "error",
      });
      return;
    }

    setReviewers(Array.isArray(res.data) ? res.data : []);
    setAssignOpen(true);
  }

  async function assignSelectedReviewers() {
    if (!authUser?.id || !selectedWork) return;

    if (selectedReviewers.length === 0) {
      showToast({
        title: "Validación",
        message: "Debes seleccionar al menos un revisor.",
        status: "error",
      });
      return;
    }

    const res = await assignScientificWorkReviewers({
      user_id: authUser.id,
      id_trabajo: selectedWork.id_trabajo,
      revisores: selectedReviewers,
    });

    if (res.status >= 400) {
      showToast({
        title: "Error",
        message: res.data?.message || "No se pudo asignar revisores.",
        status: "error",
      });
      return;
    }

    showToast({
      title: "Asignación exitosa",
      message: "Los revisores fueron asignados correctamente.",
      status: "success",
    });
    setAssignOpen(false);
  }

  async function openEvaluationsModal(work: ScientificWorkManagementItem) {
    if (!authUser?.id) return;
    setSelectedWork(work);

    const res = await listScientificWorkEvaluations(authUser.id, work.id_trabajo);
    if (res.status >= 400) {
      showToast({
        title: "Error",
        message: res.data?.message || "No se pudieron cargar las evaluaciones.",
        status: "error",
      });
      return;
    }

    if (res.data && Array.isArray(res.data.evaluaciones)) {
      setEvaluationSummary(res.data as ScientificWorkEvaluationSummary);
    } else {
      const rows = Array.isArray(res.data) ? (res.data as ScientificWorkEvaluationItem[]) : [];
      const scored = rows.filter((ev) => typeof ev.puntaje === "number") as Array<
        ScientificWorkEvaluationItem & { puntaje: number }
      >;
      const average =
        scored.length > 0 ? scored.reduce((acc, current) => acc + current.puntaje, 0) / scored.length : undefined;
      setEvaluationSummary({
        id_trabajo: work.id_trabajo,
        cantidad_evaluaciones: rows.length,
        calificacion_promedio: average,
        evaluaciones: rows,
      });
    }
    setEvaluationsOpen(true);
  }

  function openDecisionModal(work: ScientificWorkManagementItem) {
    setSelectedWork(work);
    setDecision(work.decision_comite || "PENDIENTE_REVISION");
    setDecisionComment("");
    setDecisionOpen(true);
  }

  async function submitDecision() {
    if (!authUser?.id || !selectedWork) return;

    const res = await decideScientificWork({
      user_id: authUser.id,
      id_trabajo: selectedWork.id_trabajo,
      decision_comite: decision,
      comentario_comite: decisionComment.trim(),
    });

    if (res.status >= 400) {
      showToast({
        title: "Error",
        message: res.data?.message || "No se pudo registrar la decisión.",
        status: "error",
      });
      return;
    }

    showToast({
      title: "Decisión guardada",
      message: "El estado del trabajo fue actualizado.",
      status: "success",
    });
    setDecisionOpen(false);
    await loadData();
  }

  function openEvaluationModal(work: ScientificWorkManagementItem) {
    setSelectedWork(work);
    setRecomendacion("PENDIENTE");
    setPuntaje("");
    setFortalezas("");
    setDebilidades("");
    setRecomendaciones("");
    setEvaluationOpen(true);
  }

  async function submitEvaluation() {
    if (!authUser?.id || !selectedWork) return;

    if (!fortalezas.trim() && !debilidades.trim() && !recomendaciones.trim()) {
      showToast({
        title: "Validación",
        message: "Debes registrar fortalezas, debilidades o recomendaciones.",
        status: "error",
      });
      return;
    }

    const parsedScore = Number(puntaje);
    if (!Number.isInteger(parsedScore) || parsedScore < 1 || parsedScore > 5) {
      showToast({
        title: "Validación",
        message: "La calificación debe estar entre 1 y 5.",
        status: "error",
      });
      return;
    }

    const res = await submitScientificWorkEvaluation({
      user_id: authUser.id,
      id_trabajo: selectedWork.id_trabajo,
      recomendacion: recomendacion,
      puntaje: parsedScore,
      comentarios: "",
      fortalezas: fortalezas.trim(),
      debilidades: debilidades.trim(),
      recomendaciones: recomendaciones.trim(),
    });

    if (res.status >= 400) {
      showToast({
        title: "Error",
        message: res.data?.message || "No se pudo guardar la evaluación.",
        status: "error",
      });
      return;
    }

    showToast({
      title: "Evaluación registrada",
      message: "Tu evaluación fue guardada correctamente.",
      status: "success",
    });
    setEvaluationOpen(false);
  }

  async function handleDownloadCurrentFile(work: ScientificWorkManagementItem) {
    if (!authUser?.id) return;
    if (!work.archivo_actual?.id_version) {
      showToast({
        title: "No disponible",
        message: "Este trabajo no expone archivo descargable desde esta vista.",
        status: "error",
      });
      return;
    }

    const res = await downloadScientificWorkVersion(work.archivo_actual.id_version, authUser.id);
    if (res.status >= 400) {
      showToast({
        title: "Error",
        message: "No se pudo descargar el archivo PDF.",
        status: "error",
      });
      return;
    }

    try {
      const blob = res.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = work.archivo_actual.nombre_archivo || `trabajo_${work.id_trabajo}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      showToast({
        title: "Error",
        message: "No se pudo descargar el archivo PDF.",
        status: "error",
      });
    }
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
          title="Error en Gestión de Trabajos Científicos"
          description={error}
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
          <h1 className="text-2xl font-semibold text-[#F5E427]">Gestión de Trabajos Científicos</h1>
          <p className="text-slate-300">
            Revisión de trabajos, asignación de revisores, evaluación y decisión final.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCommittee && (
            <Button
              variant={mode === "COMITE" ? "primary" : "ghost"}
              onClick={() => setMode("COMITE")}
            >
              Vista Comité
            </Button>
          )}
          {canReviewer && (
            <Button
              variant={mode === "REVISOR" ? "primary" : "ghost"}
              onClick={() => setMode("REVISOR")}
            >
              Vista Revisor
            </Button>
          )}
        </div>
      </header>

      {mode === "COMITE" && (
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 grid gap-3 md:grid-cols-4">
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            placeholder="Buscar por título/resumen/autor"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <input
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            placeholder="Autor"
            value={autor}
            onChange={(e) => setAutor(e.target.value)}
          />
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="RECIBIDO">RECIBIDO</option>
            <option value="ACTUALIZADO">ACTUALIZADO</option>
            <option value="ACEPTADO">ACEPTADO</option>
            <option value="RECHAZADO">RECHAZADO</option>
          </select>
          <Button onClick={handleFilter}>Aplicar filtros</Button>
        </div>
      )}

      {works.length === 0 ? (
        <EmptyState
          title="Sin trabajos para mostrar"
          description={
            mode === "COMITE"
              ? "No hay trabajos que coincidan con los filtros seleccionados."
              : "No tienes trabajos científicos asignados para evaluar."
          }
        />
      ) : (
        <div className="grid gap-4">
          {works.map((work) => (
            <article key={work.id_trabajo} className="rounded-xl border border-slate-700 bg-slate-800 p-5">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-slate-100">{work.titulo}</h2>
                <p className="text-sm text-slate-300 line-clamp-4">{work.resumen}</p>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                  <span>Autor: {work.autor || "N/D"}</span>
                  <span>Afiliación: {work.afiliacion_autor || "N/D"}</span>
                  <span>Estado: {work.estado}</span>
                  <span>Decisión: {formatDecisionLabel(work.decision_comite)}</span>
                  <span>Evaluaciones: {work.cantidad_evaluaciones ?? 0}</span>
                  <span>
                    Promedio: {typeof work.calificacion_promedio === "number" ? work.calificacion_promedio.toFixed(2) : "N/D"}
                  </span>
                  {mode === "REVISOR" && (
                    <span>
                      Revisado por otros: {work.revisado_previamente ? `Sí (${work.cantidad_evaluaciones_otros})` : "No"}
                    </span>
                  )}
                  <span>Versión: {work.version_actual}</span>
                  <span>Último envío: {work.fecha_ultimo_envio || "Sin fecha"}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="ghost" onClick={() => handleDownloadCurrentFile(work)}>
                  Descargar PDF
                </Button>

                {mode === "COMITE" && (
                  <>
                    <Button variant="ghost" onClick={() => openAssignModal(work)}>
                      Asignar revisores
                    </Button>
                    <Button variant="ghost" onClick={() => openEvaluationsModal(work)}>
                      Ver evaluaciones
                    </Button>
                    <Button onClick={() => openDecisionModal(work)}>Decidir estado</Button>
                  </>
                )}

                {mode === "REVISOR" && (
                  <Button onClick={() => openEvaluationModal(work)}>Evaluar trabajo</Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Asignar revisores">
        <div className="space-y-4">
          <p className="text-slate-200 font-medium">{selectedWork?.titulo}</p>
          <div className="max-h-[280px] overflow-auto space-y-2 rounded-md border border-slate-700 bg-slate-900 p-3">
            {reviewers.length === 0 && (
              <p className="text-sm text-slate-400">No hay revisores disponibles.</p>
            )}
            {reviewers.map((r) => (
              <label key={r.id_usuario} className="flex items-start gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={selectedReviewers.includes(r.id_usuario)}
                  onChange={() => toggleReviewer(r.id_usuario)}
                  className="mt-1"
                />
                <span>
                  {r.nombre} - {r.email}
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAssignOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={assignSelectedReviewers}>Guardar asignación</Button>
          </div>
        </div>
      </Modal>

      <Modal open={evaluationsOpen} onClose={() => setEvaluationsOpen(false)} title="Evaluaciones del trabajo">
        <div className="space-y-3 max-h-[420px] overflow-auto">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300">
            <p>Total evaluaciones: {evaluationSummary?.cantidad_evaluaciones ?? 0}</p>
            <p>
              Calificación promedio: {typeof evaluationSummary?.calificacion_promedio === "number"
                ? evaluationSummary.calificacion_promedio.toFixed(2)
                : "N/D"}
            </p>
          </div>

          {(evaluationSummary?.evaluaciones?.length ?? 0) === 0 && (
            <p className="text-sm text-slate-300">Aún no hay evaluaciones registradas.</p>
          )}
          {(evaluationSummary?.evaluaciones ?? []).map((ev) => (
            <div key={ev.id_evaluacion} className="rounded-lg border border-slate-700 bg-slate-900 p-3">
              <div className="text-sm text-slate-200">
                <strong>Revisor:</strong> {ev.revisor || ev.id_revisor}
              </div>
              <div className="text-sm text-slate-300">
                <strong>Recomendación:</strong> {ev.recomendacion}
              </div>
              <div className="text-sm text-slate-300">
                <strong>Puntaje:</strong> {ev.puntaje ?? "N/A"}
              </div>
              <div className="text-sm text-slate-300">
                <strong>Comentarios:</strong> {ev.comentarios}
              </div>
              <div className="text-xs text-slate-500 mt-1">{ev.updated_at}</div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={decisionOpen} onClose={() => setDecisionOpen(false)} title="Decisión final del comité">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">{selectedWork?.titulo}</p>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
          >
            <option value="ACEPTADO">ACEPTADO</option>
            <option value="RECHAZADO">RECHAZADO</option>
            <option value="PENDIENTE_REVISION">PENDIENTE DE REVISIÓN</option>
          </select>
          <textarea
            className="w-full min-h-[120px] rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            placeholder="Comentario del comité para el autor (opcional)"
            value={decisionComment}
            onChange={(e) => setDecisionComment(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDecisionOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitDecision}>Guardar decisión</Button>
          </div>
        </div>
      </Modal>

      <Modal open={evaluationOpen} onClose={() => setEvaluationOpen(false)} title="Registrar evaluación">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">{selectedWork?.titulo}</p>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            value={recomendacion}
            onChange={(e) => setRecomendacion(e.target.value)}
          >
            <option value="ACEPTAR">ACEPTAR</option>
            <option value="RECHAZAR">RECHAZAR</option>
            <option value="PENDIENTE">PENDIENTE</option>
          </select>
          <select
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            value={puntaje}
            onChange={(e) => setPuntaje(e.target.value)}
          >
            <option value="">Selecciona una calificación (1-5)</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
          <textarea
            className="w-full min-h-[120px] rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            placeholder="Fortalezas"
            value={fortalezas}
            onChange={(e) => setFortalezas(e.target.value)}
          />
          <textarea
            className="w-full min-h-[120px] rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            placeholder="Debilidades"
            value={debilidades}
            onChange={(e) => setDebilidades(e.target.value)}
          />
          <textarea
            className="w-full min-h-[120px] rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            placeholder="Recomendaciones"
            value={recomendaciones}
            onChange={(e) => setRecomendaciones(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEvaluationOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitEvaluation}>Guardar evaluación</Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}