import axios from 'axios';

export async function getEventDetail(eventoId: number): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.get(`/api/eventos?evento_id=${eventoId}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function createSession(eventoId: number, data: any): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.post(`/api/sesiones?evento=${eventoId}`, data);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function getAvailableSpeakers(eventoId: number): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.get(`/api/sesiones/ponibles?sesion_id=${eventoId}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function assignSpeakersToSession( sessionId: number, usuarios: number[]): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.post(`/api/sesiones/asignar-ponentes?sesion_id=${sessionId}`, {
      usuarios,
    });
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }

    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function updateSession( sessionId: number, data: any ): Promise<{ status: number; data: any }> {

  try {
    const response = await axios.put(`/api/sesiones?sesion_id=${sessionId}`, data);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }

    return { status: 500, data: {error: "Error de red o desconocido" } };
  }
}

export async function removeSpeakerFromSession( sessionId: number, usuarioId: number ): Promise<{ status: number; data: any }> {

  try {
    const response = await axios.post(`/api/sesiones/quitar-ponente?sesion_id=${sessionId}&usuario=${usuarioId}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }

    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}