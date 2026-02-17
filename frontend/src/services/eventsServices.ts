import axios from "axios";

export interface CreateEventPayload {
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    ubicacion: string;
}

export interface Evento {
    id_evento: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    fecha_cierre_inscripcion: string;
    inscripciones_abiertas: boolean;
    ubicacion: string;
}

export interface RangoFechasApi {
  fecha_inicio: string;
  fecha_fin: string;
}

export async function createEvent(payload: CreateEventPayload): Promise<{ status: number; data: any }> {
    try {
        const response = await axios.post("/api/eventos", payload);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { error: "Error de red o desconocido" } };
    }
}

export async function getEvents(): Promise<{ status: number; data: any }> {
    try {
        const response = await axios.get<Evento[]>("/api/eventos");
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { error: "Error de red o desconocido" } };
    }
}

export async function patchInscriptionDate(id_evento: number, action: "abrir" | "cerrar"): Promise<{ status: number; data: any }> {
    try {
        const response = await axios.patch(`/api/eventos?id=${id_evento}&action=${action}`);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { error: "Error de red o desconocido" } };
    }
}

export async function deleteEvent(id_evento: number): Promise<{ status: number; data: any }> {
    try {
        const response = await axios.delete(`/api/eventos?id=${id_evento}`);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { error: "Error de red o desconocido" } };
    }
}

export async function fetchFechasOcupadas(): Promise<{ status: number; data: RangoFechasApi[] | any }> {
    try {
        const response = await axios.get<RangoFechasApi[]>("/api/eventos/fechas-ocupadas");
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { error: "Error de red o desconocido" } };
    }
}


