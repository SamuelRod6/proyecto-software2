import { useContext, useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import SelectInput from "../../components/ui/SelectorInput";
import Loader from "../../components/ui/Loader";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import ParticipantEventsCalendar from "../../components/events/ParticipantEventsCalendar";
import ParticipantEventsList from "../../components/events/ParticipantEventsList";
import emptyAnimation from "../../assets/animations/empty-animation.json";
import { useToast } from "../../contexts/Toast/ToastContext";
import { NotificationContext } from "../../contexts/Notifications/NotificationContext";
import {
  downloadReceipt,
  getInscriptions,
  getNotifications,
  getPreferences,
  updatePreferences,
  InscriptionItem,
  NotificacionItem,
} from "../../services/inscriptionServices";
import { getInscripciones } from "../../services/inscripcionesServices";

interface Evento {
  id_evento: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  ubicacion: string;
}

function parseTypes(tipos: string): string[] {
  return tipos
    .split(/[,;|\s]+/)
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function serializeTypes(values: string[]): string {
  return Array.from(new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))).join(",");
}

function getAuthUser() {
  const raw = localStorage.getItem("auth-user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      id: number;
      name: string;
      email: string;
      role: string;
    };
  } catch {
    return null;
  }
}

export default function MyInscriptionsScreen(): JSX.Element {
  const [items, setItems] = useState<InscriptionItem[]>([]);
  const [notifications, setNotifications] = useState<NotificacionItem[]>([]);
  const [eventosInscritos, setEventosInscritos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [frequency, setFrequency] = useState("inmediata");
  const [types, setTypes] = useState("estado");
  const [enabled, setEnabled] = useState(true);
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const { showToast } = useToast();
  const { notifications: roleNotifications, clearNotifications } =
    useContext(NotificationContext);

  const frequencyOptions = [
    { value: "inmediata", label: "Inmediata" },
    { value: "diaria", label: "Diaria" },
    { value: "semanal", label: "Semanal" },
  ];

  const typeOptions = [
    { value: "estado", label: "Todos los cambios de estado" },
    { value: "aceptado", label: "Aceptado" },
    { value: "rechazado", label: "Rechazado" },
    { value: "pagado", label: "Pago validado" },
    { value: "aprobado", label: "Aprobado administrativo" },
  ];

  const authUser = getAuthUser();

  const canLoad = authUser?.id ? authUser.id > 0 : false;

  const loadData = async () => {
    if (!canLoad) return;
    setLoading(true);
    setError("");

    const [insRes, prefRes, notifRes, eventosRes] = await Promise.all([
      getInscriptions({ user_id: authUser?.id }),
      getPreferences(authUser!.id),
      getNotifications(authUser!.id),
      getInscripciones({ usuarioId: authUser?.id }),
    ]);

    if (insRes.status >= 400) {
      setError("No se pudo cargar tus inscripciones.");
      setItems([]);
    } else {
      setItems(Array.isArray(insRes.data) ? insRes.data : []);
    }

    if (prefRes.status < 400 && prefRes.data) {
      setFrequency(prefRes.data.frecuencia);
      setTypes(prefRes.data.tipos);
      setEnabled(prefRes.data.habilitado);
    }

    if (notifRes.status < 400) {
      setNotifications(Array.isArray(notifRes.data) ? notifRes.data : []);
    }

    if (eventosRes.status === 200 && eventosRes.data) {
      setEventosInscritos(eventosRes.data.eventos_inscritos || []);
    } else {
      setEventosInscritos([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [canLoad]);

  const grouped = useMemo(() => items, [items]);
  const selectedTypes = useMemo(() => parseTypes(types), [types]);

  const mergedNotifications = useMemo(() => {
    const inscriptionNotifications = notifications.map((notif) => ({
      id: `ins-${notif.id_notificacion}`,
      title: notif.asunto,
      message: notif.mensaje,
      dateLabel: notif.fecha_envio,
      timestamp: parseNotificationDate(notif.fecha_envio),
    }));

    const roleChangeNotifications = roleNotifications.map((notif) => ({
      id: `role-${notif.id}`,
      title: notif.title || "Cambio de rol",
      message: notif.content || notif.description || "",
      dateLabel: notif.createdAt
        ? new Date(notif.createdAt).toLocaleString()
        : "Sin fecha",
      timestamp: parseNotificationDate(notif.createdAt),
    }));

    return [...roleChangeNotifications, ...inscriptionNotifications].sort(
      (a, b) => b.timestamp - a.timestamp,
    );
  }, [notifications, roleNotifications]);

  function parseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
  }

  function parseNotificationDate(value?: string): number {
    if (!value) return 0;
    if (value.includes("/")) {
      const [day, month, year] = value.split("/").map(Number);
      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
        return new Date(year, month - 1, day).getTime();
      }
    }
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const handleSelectEvento = (evento: Evento) => {
    if (selectedEvento?.id_evento === evento.id_evento) {
      setSelectedEvento(null);
    } else {
      setSelectedEvento(evento);
      setCalendarMonth(parseDate(evento.fecha_inicio));
    }
  };

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
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `comprobante_${id}.pdf`;
    link.click();
    globalThis.URL.revokeObjectURL(url);
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
    const url = globalThis.URL.createObjectURL(blob);
    globalThis.open(url, "_blank");
    globalThis.setTimeout(() => globalThis.URL.revokeObjectURL(url), 2000);
  };

  const handleSavePreferences = async () => {
    if (!authUser?.id) return;
    const normalizedTypes = serializeTypes(selectedTypes);
    if (!normalizedTypes) {
      showToast({
        title: "Tipos requeridos",
        message: "Selecciona al menos un tipo de cambio para recibir notificaciones.",
        status: "error",
      });
      return;
    }

    const { status, data } = await updatePreferences({
      id_usuario: authUser.id,
      frecuencia: frequency.trim(),
      tipos: normalizedTypes,
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

    showToast({
      title: "Preferencias actualizadas",
      message: "Tus preferencias de notificación fueron guardadas.",
      status: "success",
    });
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    clearNotifications();
  };

  let eventsSection: JSX.Element;
  if (loading) {
    eventsSection = (
      <div className="flex justify-center items-center min-h-[200px] bg-slate-800 rounded-xl">
        <Loader visible={true} />
      </div>
    );
  } else if (eventosInscritos.length === 0) {
    eventsSection = (
      <div>
        <EmptyState
          title="Aún no te has inscrito en ningún evento"
          description="Cuando te inscribas en algún evento, lo mostraremos aquí."
          animationData={emptyAnimation}
        />
      </div>
    );
  } else {
    eventsSection = (
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-[0.7] flex justify-center items-center">
          <ParticipantEventsCalendar
            eventRanges={eventosInscritos.map((e) => ({
              from: parseDate(e.fecha_inicio),
              to: parseDate(e.fecha_fin),
              id: e.id_evento,
            }))}
            selectedRange={
              selectedEvento
                ? {
                    from: parseDate(selectedEvento.fecha_inicio),
                    to: parseDate(selectedEvento.fecha_fin),
                    id: selectedEvento.id_evento,
                  }
                : undefined
            }
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
          />
        </div>
        <div className="flex-[2]">
          <ParticipantEventsList
            eventos={eventosInscritos}
            onSelectEvento={handleSelectEvento}
            selectedEvento={selectedEvento}
          />
        </div>
      </div>
    );
  }

  let inscriptionsContent: JSX.Element | null;
  if (loading) {
    inscriptionsContent = null;
  } else if (error) {
    inscriptionsContent = (
      <ErrorState
        title="Error al cargar"
        description={error}
        buttonText="Volver a intentar"
        onRetry={loadData}
      />
    );
  } else if (grouped.length === 0) {
    inscriptionsContent = (
      <EmptyState
        title="Aún no tienes inscripciones"
        description="Cuando te inscribas a un evento, aparecerá aquí."
        animationData={emptyAnimation}
      />
    );
  } else {
    inscriptionsContent = (
      <div className="grid gap-4">
        {grouped.map((item) => (
          <div
            key={item.id_inscripcion}
            className="rounded-lg border border-slate-700 bg-slate-800/80 p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[#F5E427]">
                  {item.evento_nombre}
                </h3>
                <p className="text-sm text-slate-300">
                  Inscrito el {item.fecha_inscripcion}
                </p>
              </div>
              <span className="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-200">
                {item.estado}
              </span>
            </div>
            <div className="mt-4 text-sm text-slate-300">
              Fecha limite de pago: {item.fecha_limite_pago}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => handleDownload(item.id_inscripcion)}>
                Descargar comprobante
              </Button>
              <Button
                variant="ghost"
                onClick={() => handleView(item.id_inscripcion)}
              >
                Ver comprobante
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-6 bg-slate-900 min-h-screen px-4 py-8">
      {eventsSection}
      <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#F5E427]">Comprobantes</h2>
        </div>
        <div className="mt-4 max-h-[430px] overflow-y-auto pr-2">
          {inscriptionsContent}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-6">
          <h2 className="text-lg font-semibold text-[#F5E427]">
            Preferencias de notificación
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Elige cómo y cuándo quieres recibir avisos sobre tu inscripción.
          </p>
          <div className="mt-4 grid gap-3">
            <SelectInput
              value={frequency}
              onChange={(value) =>
                setFrequency(Array.isArray(value) ? (value[0] ?? "") : value)
              }
              options={frequencyOptions}
              inputLabel="Frecuencia"
              placeholder="Selecciona"
              allowCustom={false}
            />
            <SelectInput
              value={selectedTypes}
              onChange={(value) =>
                setTypes(serializeTypes(Array.isArray(value) ? value : [value]))
              }
              options={typeOptions}
              inputLabel="Tipos de cambios"
              placeholder="Selecciona"
              allowCustom={false}
              isMulti
            />
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <span>Recibir notificaciones</span>
            </label>
            <Button onClick={handleSavePreferences}>
              Guardar preferencias
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800/80 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#F5E427]">
              Historial de notificaciones
            </h2>
            <Button variant="ghost" onClick={handleClearNotifications}>
              Vaciar historial
            </Button>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Desliza para ver mas
          </div>
          <div className="mt-4 max-h-[320px] overflow-y-auto space-y-3 pr-2">
            {mergedNotifications.length === 0 ? (
              <p className="text-sm text-slate-400">Sin notificaciones.</p>
            ) : (
              mergedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="rounded-md border border-slate-700 bg-slate-900/60 p-3"
                >
                  <p className="text-sm font-semibold text-slate-200">
                    {notif.title}
                  </p>
                  <p className="text-xs text-slate-400">{notif.dateLabel}</p>
                  <p className="mt-1 text-sm text-slate-300">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
