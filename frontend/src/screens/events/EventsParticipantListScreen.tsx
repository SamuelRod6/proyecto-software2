import React, { useEffect, useMemo, useState } from "react";
// contexts
import { useAuth } from "../../contexts/Auth/Authcontext";
import { useToast } from "../../contexts/Toast/ToastContext";
// services
import { getInscripciones } from "../../services/inscripcionesServices";
import { RESOURCE_KEYS } from "../../constants/resources";
import { hasResourceAccess } from "../../utils/accessControl";
// components
import Loader from "../../components/ui/Loader";
import EmptyState from "../../components/ui/EmptyState";
import AvailableEventsList from "../../components/events/AvailableEventsList";
import InscriptionCreateModal from "../../components/inscriptions/InscriptionCreateModal";
import EventFilters from "../../components/events/EventFilters";
// assets
import emptyAnimation from "../../assets/animations/empty-animation.json";

interface Evento {
  id_evento: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_cierre_inscripcion: string;
  inscripciones_abiertas: boolean;
  ubicacion: string;
  inscrito?: boolean;
}

const AVAILABLE_EVENTS_PAGE_SIZE = 6;

const EventsParticipantListScreen: React.FC = () => {
  // states
  const [loading, setLoading] = useState(true);
  const [loadingDisponibles, setLoadingDisponibles] = useState(false);
  const [eventosInscritos, setEventosInscritos] = useState<Evento[]>([]);
  const [eventosDisponibles, setEventosDisponibles] = useState<Evento[]>([]);
  const [inscribirEventoModal, setInscribirEventoModal] = useState<{
    open: boolean;
    evento: Evento | null;
  }>({ open: false, evento: null });
  const [canInscribir, setCanInscribir] = useState(false);
  // filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [countryTerm, setCountryTerm] = useState("");
  const [cityTerm, setCityTerm] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [availablePage, setAvailablePage] = useState(1);
  const [totalDisponibles, setTotalDisponibles] = useState(0);
  // contexts
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchDisponiblesFiltrados = async () => {
    if (!user?.id) {
      setEventosInscritos([]);
      setEventosDisponibles([]);
      setTotalDisponibles(0);
      return;
    }

    const offset = (availablePage - 1) * AVAILABLE_EVENTS_PAGE_SIZE;
    setLoadingDisponibles(true);
    try {
      const { status, data } = await getInscripciones({
        usuarioId: user.id,
        searchTerm,
        countryTerm,
        cityTerm,
        fromDate,
        toDate,
        limit: AVAILABLE_EVENTS_PAGE_SIZE,
        offset,
      });

      if (status === 200 && data) {
        setEventosInscritos(data.eventos_inscritos || []);
        setEventosDisponibles(data.eventos_disponibles || []);
        const total = Number(data.total_disponibles ?? 0);
        setTotalDisponibles(Number.isFinite(total) ? total : 0);
      } else {
        setEventosInscritos([]);
        setEventosDisponibles([]);
        setTotalDisponibles(0);
        showToast({
          title: "Error",
          status: "error",
          message:
            data?.message ||
            data?.error ||
            "No se pudieron cargar los eventos disponibles",
        });
      }
    } catch (error: any) {
      setEventosInscritos([]);
      setTotalDisponibles(0);
      showToast({
        title: "Error",
        status: "error",
        message: error?.message || "Error al cargar eventos disponibles",
      });
    } finally {
      setLoadingDisponibles(false);
    }
  };

  // initial load when user changes
  useEffect(() => {
    const run = async () => {
      if (!user?.id) {
        setLoading(false);
        setEventosDisponibles([]);
        setTotalDisponibles(0);
        return;
      }

      setLoading(true);
      await fetchDisponiblesFiltrados();
      setLoading(false);
    };

    run();
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    const checkAccess = async () => {
      const access = await hasResourceAccess(RESOURCE_KEYS.EVENTS_INSCRIPTION);
      if (isMounted) {
        setCanInscribir(access);
      }
    };
    void checkAccess();
    return () => {
      isMounted = false;
    };
  }, []);

  // refetch only available events when filters change
  useEffect(() => {
    if (!user?.id) return;

    const timeoutId = window.setTimeout(() => {
      fetchDisponiblesFiltrados();
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [
    user,
    searchTerm,
    countryTerm,
    cityTerm,
    fromDate,
    toDate,
    availablePage,
  ]);

  useEffect(() => {
    setAvailablePage(1);
  }, [searchTerm, countryTerm, cityTerm, fromDate, toDate]);

  const totalAvailablePages = Math.max(
    1,
    Math.ceil(totalDisponibles / AVAILABLE_EVENTS_PAGE_SIZE),
  );

  useEffect(() => {
    if (availablePage > totalAvailablePages) {
      setAvailablePage(totalAvailablePages);
    }
  }, [availablePage, totalAvailablePages]);

  const eventosVisibles = useMemo(() => {
    const inscritos = eventosInscritos.map((evento) => ({
      ...evento,
      inscrito: true,
    }));
    const disponibles = eventosDisponibles.map((evento) => ({
      ...evento,
      inscrito: false,
    }));
    return [...inscritos, ...disponibles];
  }, [eventosInscritos, eventosDisponibles]);

  // show loader while loading
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader visible={true} />
      </div>
    );
  }

  // Handler to open inscription modal for a specific event
  const handleOpenInscribirModal = (evento: Evento) => {
    if (!canInscribir) return;
    if (!user?.id) {
      showToast({
        title: "No autenticado",
        status: "error",
        message: "Debes iniciar sesión para inscribirte.",
      });
      return;
    }
    setInscribirEventoModal({ open: true, evento });
  };

  const handleCloseInscribirModal = () => {
    setInscribirEventoModal({ open: false, evento: null });
  };

  return (
    <section className="space-y-8 bg-slate-900 min-h-screen px-4 py-8">
      {/* Filtros de eventos */}
      <EventFilters
        searchTerm={searchTerm}
        countryTerm={countryTerm}
        cityTerm={cityTerm}
        fromDate={fromDate}
        toDate={toDate}
        onSearchTermChange={setSearchTerm}
        onCountryTermChange={setCountryTerm}
        onCityTermChange={setCityTerm}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
      />
      <div>
        {loadingDisponibles ? (
          <div className="flex justify-center items-center min-h-[200px] bg-slate-800 rounded-xl">
            <Loader visible={true} />
          </div>
        ) : eventosVisibles.length === 0 ? (
          <EmptyState
            title="No hay eventos disponibles"
            description="Cuando existan eventos disponibles para inscribirte, los mostraremos aquí."
            animationData={emptyAnimation}
          />
        ) : (
          <>
            <AvailableEventsList
              eventos={eventosVisibles}
              onInscribir={handleOpenInscribirModal}
              canInscribir={canInscribir}
            />
            {totalAvailablePages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300 mt-6">
                {" "}
                {/* Añadí mt-6 para igualar el space-y-6 de Roles */}
                <span>
                  Página {availablePage} de {totalAvailablePages}
                </span>
                <div className="flex gap-2">
                  <button
                    className="rounded-md border border-slate-600 px-3 py-1 text-slate-200 transition hover:border-[#F5E427] hover:text-[#F5E427] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={availablePage <= 1 || loadingDisponibles} // Mantiene estética de bloqueo
                    onClick={() => {
                      setAvailablePage((prev) => Math.max(1, prev - 1));
                      window.scrollTo({ top: 0, behavior: "smooth" }); // Opcional: mejora UX al paginar
                    }}
                  >
                    Anterior
                  </button>
                  <button
                    className="rounded-md border border-slate-600 px-3 py-1 text-slate-200 transition hover:border-[#F5E427] hover:text-[#F5E427] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={
                      availablePage >= totalAvailablePages || loadingDisponibles
                    }
                    onClick={() => {
                      setAvailablePage((prev) =>
                        Math.min(totalAvailablePages, prev + 1),
                      );
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <InscriptionCreateModal
        open={inscribirEventoModal.open}
        onClose={handleCloseInscribirModal}
        eventoId={inscribirEventoModal.evento?.id_evento ?? null}
        eventoNombre={inscribirEventoModal.evento?.nombre ?? ""}
        userId={user?.id ?? 0}
        userEmail={user?.email ?? ""}
        userName={user?.name ?? ""}
      />
    </section>
  );
};

export default EventsParticipantListScreen;
