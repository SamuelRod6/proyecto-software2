import type { MensajeApi } from "../../services/mensajesServices";

interface Props {
  mensaje: MensajeApi;
  esMio: boolean;
}

export default function MensajeItem({ mensaje, esMio }: Props): JSX.Element {
  const fecha = new Date(mensaje.created_at).toLocaleString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });

  return (
    <div className={`flex ${esMio ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-xs rounded-2xl px-4 py-2 shadow ${
          esMio
            ? "bg-[#F5E427] text-slate-900"
            : "bg-slate-700 text-slate-100"
        }`}
      >
        {!esMio && (
          <p className="mb-1 text-xs font-semibold text-slate-400">
            {mensaje.nombre_remitente}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words text-sm">{mensaje.cuerpo}</p>
        {mensaje.adjunto_url && (
          <a
            href={mensaje.adjunto_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 block text-xs underline ${esMio ? "text-slate-700" : "text-[#F5E427]"}`}
          >
            📎 {mensaje.adjunto_nombre ?? "Adjunto"}
          </a>
        )}
        <p className={`mt-1 text-right text-xs ${esMio ? "text-slate-600" : "text-slate-400"}`}>
          {fecha}
        </p>
      </div>
    </div>
  );
}
