/*
File: eventsServices.ts

Contains:
Event API service wrappers for CRUD operations and inscription state changes.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

export async function patchEvent(id_evento: number, payload: CreateEventPayload): Promise<{ status: number; data: any }> {
    try {
        const response = await axios.put(`/api/eventos?id=${id_evento}`, payload);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { error: "Error de red o desconocido" } };
    }
}
import axios from "axios";

export interface CreateEventPayload {
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    fecha_cierre_inscripcion: string;
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

// createEvent registers a new event with scheduling and location data.
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

// getEvents retrieves all events available to the current frontend view.
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

// patchInscriptionDate toggles inscriptions for one event using abrir/cerrar actions.
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

// deleteEvent removes one event by id.
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

// fetchFechasOcupadas obtains occupied ranges used by event scheduling UI validations.
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


