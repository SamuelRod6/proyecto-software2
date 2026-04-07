/*
File: notificationsServices.ts

Contains:
Notification API service wrappers for listing and marking notifications as read.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

import axios from "axios";

export interface NotificationApi {
  id_notificacion: number;
  id_usuario: number;
  id_evento?: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
}

// fetchNotificationsApi loads notifications belonging to one user.
export async function fetchNotificationsApi(userId: number): Promise<{ status: number; data: NotificationApi[] | any }> {
  try {
    const response = await axios.get<NotificationApi[]>(`/api/notifications/user/${userId}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

// markNotificationAsReadApi updates one notification state to read.
export async function markNotificationAsReadApi(notificationId: number): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.patch(`/api/notifications/${notificationId}/leida`, { leida: true });
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}
