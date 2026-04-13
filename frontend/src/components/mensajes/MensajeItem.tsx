import { useState } from "react";
import type { MensajeApi } from "../../services/mensajesServices";
import { resolveAdjuntoUrl } from "../../services/mensajesServices";

interface Props {
  mensaje: MensajeApi;
  esMio: boolean;
}

export default function MensajeItem({ mensaje, esMio }: Props): JSX.Element {
  const [showImageModal, setShowImageModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const adjuntoHref = resolveAdjuntoUrl(mensaje.adjunto_url);
  const adjuntoNombre = (mensaje.adjunto_nombre ?? "").toLowerCase();
  const adjuntoRuta = (mensaje.adjunto_url ?? "").toLowerCase();
  const isImageAdjunto =
    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(adjuntoNombre) ||
    /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(adjuntoRuta);
  const fecha = new Date(mensaje.created_at).toLocaleString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });

  const handleDownloadImage = async () => {
    if (!adjuntoHref || downloading) return;

    try {
      setDownloading(true);
      const response = await fetch(adjuntoHref);
      if (!response.ok) {
        throw new Error(`download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = mensaje.adjunto_nombre ?? "imagen-chat";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Error al descargar imagen", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`flex ${esMio ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-xs rounded-2xl px-4 py-2 shadow ${
          esMio ? "bg-[#F5E427] text-slate-900" : "bg-slate-700 text-slate-100"
        }`}
      >
        {!esMio && (
          <p className="mb-1 text-xs font-semibold text-slate-400">
            {mensaje.nombre_remitente}
          </p>
        )}
        {mensaje.cuerpo.trim() !== "" && (
          <p className="whitespace-pre-wrap break-words text-sm">
            {mensaje.cuerpo}
          </p>
        )}
        {adjuntoHref && isImageAdjunto && (
          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            className={`mt-1 block text-xs underline ${esMio ? "text-slate-700" : "text-[#F5E427]"}`}
          >
            📎 {mensaje.adjunto_nombre ?? "Imagen"}
          </button>
        )}
        {adjuntoHref && !isImageAdjunto && (
          <a
            href={adjuntoHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 block text-xs underline ${esMio ? "text-slate-700" : "text-[#F5E427]"}`}
          >
            📎 {mensaje.adjunto_nombre ?? "Adjunto"}
          </a>
        )}
        <p
          className={`mt-1 text-right text-xs ${esMio ? "text-slate-600" : "text-slate-400"}`}
        >
          {fecha}
        </p>
      </div>

      {showImageModal && adjuntoHref && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowImageModal(false)}
          role="presentation"
        >
          <div
            className="relative max-h-[90vh] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <button
              type="button"
              onClick={() => setShowImageModal(false)}
              className="absolute -right-2 -top-2 rounded-full bg-slate-900 px-2 py-1 text-xs text-slate-100"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => void handleDownloadImage()}
              disabled={downloading}
              className="absolute left-2 top-2 rounded-lg bg-slate-900 px-3 py-1 text-xs text-slate-100 hover:bg-slate-700"
            >
              {downloading ? "Descargando..." : "Descargar"}
            </button>
            <img
              src={adjuntoHref}
              alt={mensaje.adjunto_nombre ?? "Adjunto de imagen"}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
