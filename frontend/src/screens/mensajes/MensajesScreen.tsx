import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/Auth/Authcontext";
import { fetchConversaciones } from "../../services/mensajesServices";
import type { ConversacionApi } from "../../services/mensajesServices";
import NuevaConversacionModal from "../../components/mensajes/NuevaConversacionModal";
import { ROUTES } from "../../navigation/routes";

export default function MensajesScreen(): JSX.Element {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversaciones, setConversaciones] = useState<ConversacionApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const cargarConversaciones = async () => {
    if (!user?.id) return;
    const res = await fetchConversaciones(user.id);
    if (res.status === 200 && Array.isArray(res.data)) {
      setConversaciones(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    void cargarConversaciones();
    const interval = setInterval(() => void cargarConversaciones(), 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleCreated = (conversacionId: number) => {
    setShowModal(false);
    navigate(ROUTES.conversacion(String(conversacionId)));
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-100">Mensajes</h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-[#F5E427] px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-yellow-300"
        >
          + Nueva conversación
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400">Cargando...</p>
      ) : conversaciones.length === 0 ? (
        <div className="rounded-xl bg-slate-800 p-8 text-center text-slate-400">
          <p className="text-lg">No tienes conversaciones aún.</p>
          <p className="mt-1 text-sm">Crea una nueva para comenzar a mensajear.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {conversaciones.map((conv) => {
            const otrosParticipantes = conv.participantes
              .filter((p) => p.id_usuario !== user?.id)
              .map((p) => p.nombre)
              .join(", ");
            return (
              <li
                key={conv.id_conversacion}
                onClick={() => navigate(ROUTES.conversacion(String(conv.id_conversacion)))}
                className="cursor-pointer rounded-xl bg-slate-800 px-5 py-4 transition-colors hover:bg-slate-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-100">
                      {conv.asunto || otrosParticipantes || "Sin asunto"}
                    </p>
                    <p className="text-xs text-slate-400">{otrosParticipantes}</p>
                  </div>
                  {conv.ultimo_mensaje && (
                    <p className="max-w-xs truncate text-right text-sm text-slate-400">
                      {conv.ultimo_mensaje.cuerpo}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showModal && user?.id && (
        <NuevaConversacionModal
          currentUserId={user.id}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
