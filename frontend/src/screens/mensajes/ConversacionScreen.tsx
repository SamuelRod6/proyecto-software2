import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/Auth/Authcontext";
import {
  fetchMensajes,
  sendMensaje,
  uploadAdjunto,
  getParticipantes,
  addParticipante,
  removeParticipante,
  searchUsuarios,
} from "../../services/mensajesServices";
import type { MensajeApi, ParticipanteApi } from "../../services/mensajesServices";
import MensajeItem from "../../components/mensajes/MensajeItem";
import { ROUTES } from "../../navigation/routes";

export default function ConversacionScreen(): JSX.Element {
  const { conversacionId } = useParams<{ conversacionId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mensajes, setMensajes] = useState<MensajeApi[]>([]);
  const [cuerpo, setCuerpo] = useState("");
  const [adjunto, setAdjunto] = useState<{ url: string; nombre: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gestión de miembros
  const [showMembers, setShowMembers] = useState(false);
  const [participantes, setParticipantes] = useState<ParticipanteApi[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ParticipanteApi[]>([]);
  const [memberError, setMemberError] = useState("");
  const debounceRef = useRef<number | null>(null);

  const cargarMensajes = async () => {
    if (!conversacionId) return;
    const res = await fetchMensajes(Number(conversacionId));
    if (res.status === 200 && Array.isArray(res.data)) {
      setMensajes(res.data);
    }
  };

  const cargarParticipantes = async () => {
    if (!conversacionId) return;
    const res = await getParticipantes(Number(conversacionId));
    if (res.status === 200 && Array.isArray(res.data)) {
      setParticipantes(res.data);
    }
  };

  useEffect(() => {
    void cargarMensajes();
    void cargarParticipantes();
    const interval = setInterval(() => void cargarMensajes(), 5000);
    return () => clearInterval(interval);
  }, [conversacionId]);

  useEffect(() => {
    if (busqueda.trim().length < 2) { setResultadosBusqueda([]); return; }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const res = await searchUsuarios(busqueda);
      if (res.status === 200 && Array.isArray(res.data)) {
        setResultadosBusqueda(
          res.data.filter((u: ParticipanteApi) => !participantes.some((p) => p.id_usuario === u.id_usuario))
        );
      }
    }, 300);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [busqueda, participantes]);

  const handleAddParticipante = async (u: ParticipanteApi) => {
    setMemberError("");
    const res = await addParticipante(Number(conversacionId), u.id_usuario);
    if (res.status === 201) {
      setBusqueda("");
      setResultadosBusqueda([]);
      void cargarParticipantes();
    } else {
      setMemberError("Error al agregar miembro.");
    }
  };

  const handleRemoveParticipante = async (idUsuario: number) => {
    setMemberError("");
    const res = await removeParticipante(Number(conversacionId), idUsuario);
    if (res.status === 204) {
      void cargarParticipantes();
    } else {
      setMemberError("Error al eliminar miembro.");
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await uploadAdjunto(file);
      setAdjunto(result);
    } catch {
      setError("Error al subir el archivo. Verifica el tipo (jpeg, png, pdf).");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!cuerpo.trim() && !adjunto) {
      setError("Escribe un mensaje o adjunta un archivo.");
      return;
    }
    if (!user?.id || !conversacionId) return;
    setSending(true);
    setError("");
    const res = await sendMensaje(
      Number(conversacionId),
      user.id,
      cuerpo.trim(),
      adjunto?.url,
      adjunto?.nombre
    );
    setSending(false);
    if (res.status === 201) {
      setCuerpo("");
      setAdjunto(null);
      void cargarMensajes();
    } else {
      setError("Error al enviar el mensaje.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-2xl flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(ROUTES.mensajes)}
          className="rounded-lg px-2 py-1 text-slate-400 hover:text-slate-200"
        >
          ← Volver
        </button>
        <h1 className="text-lg font-semibold text-slate-100">Conversación</h1>
        <button
          onClick={() => setShowMembers((v) => !v)}
          className="ml-auto rounded-lg bg-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-600"
        >
          👥 Miembros ({participantes.length})
        </button>
      </div>

      {/* Panel gestión de miembros */}
      {showMembers && (
        <div className="mb-4 rounded-xl bg-slate-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-[#F5E427]">Gestionar miembros</h2>

          <ul className="mb-3 space-y-2">
            {participantes.map((p) => (
              <li key={p.id_usuario} className="flex items-center justify-between rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-200">
                <span>{p.nombre} <span className="text-slate-400 text-xs">({p.email})</span></span>
                {p.id_usuario !== user?.id && (
                  <button
                    onClick={() => void handleRemoveParticipante(p.id_usuario)}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Eliminar
                  </button>
                )}
              </li>
            ))}
          </ul>

          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar usuario para agregar..."
            className="w-full rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-[#F5E427]"
          />
          {resultadosBusqueda.length > 0 && (
            <ul className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900">
              {resultadosBusqueda.map((u) => (
                <li
                  key={u.id_usuario}
                  onClick={() => void handleAddParticipante(u)}
                  className="cursor-pointer px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
                >
                  {u.nombre} <span className="text-slate-400">({u.email})</span>
                </li>
              ))}
            </ul>
          )}
          {memberError && <p className="mt-2 text-xs text-red-400">{memberError}</p>}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl bg-slate-800 p-4">
        {mensajes.length === 0 ? (
          <p className="text-center text-sm text-slate-400">No hay mensajes aún. ¡Sé el primero!</p>
        ) : (
          mensajes.map((m) => (
            <MensajeItem key={m.id_mensaje} mensaje={m} esMio={m.id_remitente === user?.id} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="mt-3 rounded-xl bg-slate-800 p-3">
        {adjunto && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-1 text-xs text-slate-200">
            <span>📎 {adjunto.nombre}</span>
            <button onClick={() => setAdjunto(null)} className="ml-auto text-slate-400 hover:text-slate-100">
              ×
            </button>
          </div>
        )}
        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
            rows={2}
            className="flex-1 resize-none rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-[#F5E427]"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Adjuntar archivo"
            className="rounded-lg bg-slate-700 px-3 py-2 text-slate-300 hover:bg-slate-600 disabled:opacity-50"
          >
            {uploading ? "⏳" : "📎"}
          </button>
          <button
            onClick={() => void handleSend()}
            disabled={sending}
            className="rounded-lg bg-[#F5E427] px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-yellow-300 disabled:opacity-50"
          >
            {sending ? "..." : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
