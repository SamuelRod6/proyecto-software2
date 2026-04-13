import { useEffect, useRef, useState } from "react";
import type { ParticipanteApi } from "../../services/mensajesServices";
import { createConversacion, searchUsuarios } from "../../services/mensajesServices";

interface Props {
  currentUserId: number;
  onClose: () => void;
  onCreated: (conversacionId: number) => void;
}

export default function NuevaConversacionModal({ currentUserId, onClose, onCreated }: Props): JSX.Element {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<ParticipanteApi[]>([]);
  const [seleccionados, setSeleccionados] = useState<ParticipanteApi[]>([]);
  const [asunto, setAsunto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResultados([]);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const res = await searchUsuarios(query);
      if (res.status === 200 && Array.isArray(res.data)) {
        setResultados(
          res.data.filter(
            (u: ParticipanteApi) =>
              u.id_usuario !== currentUserId &&
              !seleccionados.some((s) => s.id_usuario === u.id_usuario)
          )
        );
      }
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, currentUserId, seleccionados]);

  const agregarParticipante = (u: ParticipanteApi) => {
    setSeleccionados((prev) => [...prev, u]);
    setQuery("");
    setResultados([]);
  };

  const quitarParticipante = (id: number) => {
    setSeleccionados((prev) => prev.filter((u) => u.id_usuario !== id));
  };

  const handleSubmit = async () => {
    if (seleccionados.length === 0) {
      setError("Selecciona al menos un destinatario.");
      return;
    }
    setLoading(true);
    setError("");
    const ids = [currentUserId, ...seleccionados.map((u) => u.id_usuario)];
    const res = await createConversacion(asunto, ids);
    setLoading(false);
    if (res.status === 201 && res.data?.id_conversacion) {
      onCreated(res.data.id_conversacion);
    } else {
      setError("Error al crear la conversación. Intenta de nuevo.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-[#F5E427]">Nueva conversación</h2>

        <label className="mb-1 block text-sm text-slate-300">Asunto</label>
        <input
          type="text"
          value={asunto}
          onChange={(e) => setAsunto(e.target.value)}
          placeholder="Asunto (opcional)"
          className="mb-4 w-full rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-[#F5E427]"
        />

        <label className="mb-1 block text-sm text-slate-300">Buscar destinatarios</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre o email..."
          className="w-full rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-[#F5E427]"
        />

        {resultados.length > 0 && (
          <ul className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900">
            {resultados.map((u) => (
              <li
                key={u.id_usuario}
                onClick={() => agregarParticipante(u)}
                className="cursor-pointer px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
              >
                {u.nombre} <span className="text-slate-400">({u.email})</span>
              </li>
            ))}
          </ul>
        )}

        {seleccionados.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {seleccionados.map((u) => (
              <span
                key={u.id_usuario}
                className="flex items-center gap-1 rounded-full bg-[#F5E427] px-3 py-1 text-xs font-medium text-slate-900"
              >
                {u.nombre}
                <button onClick={() => quitarParticipante(u.id_usuario)} className="ml-1 font-bold">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-[#F5E427] px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-yellow-300 disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear conversación"}
          </button>
        </div>
      </div>
    </div>
  );
}
