/*
File: sessionsServices.ts

Contains:
Session API service wrappers for creation, updates, and speaker assignment management.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

import axios from 'axios';

// getEventDetail retrieves event information used to constrain session scheduling.
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

// createSession registers a new session for a target event.
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

// getAvailableSpeakers returns selectable speakers for a session.
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

// assignSpeakersToSession assigns one or more users as session speakers.
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

// updateSession updates the core metadata of an existing session.
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

// removeSpeakerFromSession removes one assigned speaker from a session.
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