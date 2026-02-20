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

export async function fetchNotificationsApi(userId: number): Promise<{ status: number; data: NotificationApi[] | any }> {
  try {
    const response = await axios.get<NotificationApi[]>(`/api/notificaciones?userId=${userId}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}

export async function markNotificationAsReadApi(notificationId: number): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.patch(`/api/notificaciones/${notificationId}/leida`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { error: "Error de red o desconocido" } };
  }
}
