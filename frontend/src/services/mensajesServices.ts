import axios from "axios";

export interface ParticipanteApi {
  id_usuario: number;
  nombre: string;
  email: string;
}

export interface MensajeApi {
  id_mensaje: number;
  id_conversacion: number;
  id_remitente: number;
  nombre_remitente: string;
  cuerpo: string;
  adjunto_url?: string;
  adjunto_nombre?: string;
  created_at: string;
}

export interface ConversacionApi {
  id_conversacion: number;
  asunto: string;
  participantes: ParticipanteApi[];
  ultimo_mensaje?: MensajeApi;
  updated_at: string;
}

export async function fetchConversaciones(userId: number): Promise<{ status: number; data: ConversacionApi[] | any }> {
  try {
    const response = await axios.get<ConversacionApi[]>(`/api/mensajes/conversaciones?user_id=${userId}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) return { status: error.response.status, data: error.response.data };
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function fetchMensajes(conversacionId: number): Promise<{ status: number; data: MensajeApi[] | any }> {
  try {
    const response = await axios.get<MensajeApi[]>(`/api/mensajes/conversaciones/${conversacionId}/mensajes`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) return { status: error.response.status, data: error.response.data };
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function createConversacion(
  asunto: string,
  participanteIds: number[]
): Promise<{ status: number; data: ConversacionApi | any }> {
  try {
    const response = await axios.post<ConversacionApi>("/api/mensajes/conversaciones", {
      asunto,
      participante_ids: participanteIds,
    });
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) return { status: error.response.status, data: error.response.data };
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function sendMensaje(
  idConversacion: number,
  idRemitente: number,
  cuerpo: string,
  adjuntoUrl?: string,
  adjuntoNombre?: string
): Promise<{ status: number; data: MensajeApi | any }> {
  try {
    const response = await axios.post<MensajeApi>(
      `/api/mensajes/conversaciones/${idConversacion}/mensajes`,
      { id_conversacion: idConversacion, id_remitente: idRemitente, cuerpo, adjunto_url: adjuntoUrl, adjunto_nombre: adjuntoNombre }
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) return { status: error.response.status, data: error.response.data };
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function searchUsuarios(q: string): Promise<{ status: number; data: ParticipanteApi[] | any }> {
  try {
    const response = await axios.get<ParticipanteApi[]>(`/api/mensajes/usuarios/buscar?q=${encodeURIComponent(q)}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) return { status: error.response.status, data: error.response.data };
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function getParticipantes(conversacionId: number): Promise<{ status: number; data: ParticipanteApi[] | any }> {
  try {
    const response = await axios.get<ParticipanteApi[]>(`/api/mensajes/conversaciones/${conversacionId}/participantes`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) return { status: error.response.status, data: error.response.data };
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function addParticipante(conversacionId: number, idUsuario: number): Promise<{ status: number; data: ConversacionApi | any }> {
  try {
    const response = await axios.post<ConversacionApi>(`/api/mensajes/conversaciones/${conversacionId}/participantes`, { id_usuario: idUsuario });
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) return { status: error.response.status, data: error.response.data };
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function removeParticipante(conversacionId: number, idUsuario: number): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.delete(`/api/mensajes/conversaciones/${conversacionId}/participantes/${idUsuario}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) return { status: error.response.status, data: error.response.data };
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function uploadAdjunto(file: File): Promise<{ url: string; nombre: string }> {
  const form = new FormData();
  form.append("file", file);
  const response = await axios.post<{ url: string; nombre: string }>("/api/mensajes/adjuntos", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
