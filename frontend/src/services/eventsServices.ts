import axios from "axios";

export interface CreateEventPayload {
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    ubicacion: string;
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

export interface Evento {
    id_evento: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    fecha_cierre_inscripcion: string;
    inscripciones_abiertas: boolean;
    ubicacion: string;
}

export async function getEvents(): Promise<{ status: number; data: Evento[] | any }> {
    try {
        const response = await axios.get<Evento[]>("/api/eventos");
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            // Error de backend
            return { status: error.response.status, data: error.response.data };
        }
        // Error de red u otro
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

