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
