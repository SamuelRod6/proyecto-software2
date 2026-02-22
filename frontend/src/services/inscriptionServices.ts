import axios from "axios";

export interface CreateInscriptionPayload {
    id_evento: number;
    id_usuario: number;
    nombre_participante: string;
    email: string;
    afiliacion: string;
    comprobante_pago?: string;
}

export interface InscriptionItem {
    id_inscripcion: number;
    id_evento: number;
    evento_nombre: string;
    id_usuario: number;
    nombre_participante: string;
    email: string;
    afiliacion: string;
    comprobante_pago?: string | null;
    fecha_inscripcion: string;
    fecha_limite_pago: string;
    estado: string;
}

export interface UpdateEstadoPayload {
    id_inscripcion: number;
    estado: string;
    nota?: string;
    actor?: string;
}

export interface PreferenciasPayload {
    id_usuario: number;
    frecuencia: string;
    tipos: string;
    habilitado: boolean;
}

export interface PreferenciasResponse {
    id_usuario: number;
    frecuencia: string;
    tipos: string;
    habilitado: boolean;
}

export interface NotificacionItem {
    id_notificacion: number;
    id_usuario: number;
    id_inscripcion?: number | null;
    canal: string;
    asunto: string;
    mensaje: string;
    fecha_envio: string;
    estado: string;
}

export interface ReporteResponse {
    total: number;
    por_estado: Record<string, number>;
    registros: InscriptionItem[];
}

export interface ReporteProgramadoPayload {
    id_evento?: number | null;
    estado?: string;
    frecuencia: string;
    formato: string;
    creado_por?: string;
}

export interface ReporteProgramadoItem {
    id_reporte: number;
    id_evento?: number | null;
    estado?: string | null;
    frecuencia: string;
    formato: string;
    creado_por?: string | null;
    creado_en: string;
}

export async function createInscription(payload: CreateInscriptionPayload) {
    try {
        const response = await axios.post("/api/inscripciones", payload);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { message: "Error de red o desconocido" } };
    }
}

export async function getInscriptions(params: Record<string, any>) {
    try {
        const response = await axios.get<InscriptionItem[]>("/api/inscripciones", { params });
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { message: "Error de red o desconocido" } };
    }
}

export async function updateInscriptionStatus(payload: UpdateEstadoPayload) {
    try {
        const response = await axios.patch("/api/inscripciones/status", payload);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { message: "Error de red o desconocido" } };
    }
}

export async function getInscriptionHistory(id: number) {
    try {
        const response = await axios.get(`/api/inscripciones/historial?id=${id}`);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { message: "Error de red o desconocido" } };
    }
}

export async function getPreferences(userId: number) {
    try {
        const response = await axios.get<PreferenciasResponse>(`/api/inscripciones/preferencias?user_id=${userId}`);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { message: "Error de red o desconocido" } };
    }
}

export async function updatePreferences(payload: PreferenciasPayload) {
    try {
        const response = await axios.put<PreferenciasResponse>("/api/inscripciones/preferencias", payload);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { message: "Error de red o desconocido" } };
    }
}

export async function getNotifications(userId: number) {
    try {
        const response = await axios.get<NotificacionItem[]>(`/api/inscripciones/notificaciones?user_id=${userId}`);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { message: "Error de red o desconocido" } };
    }
}

export async function getReports(params: Record<string, any>) {
    try {
        const response = await axios.get<ReporteResponse>("/api/inscripciones/reportes", { params });
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { message: "Error de red o desconocido" } };
    }
}

export async function downloadReport(params: Record<string, any>, format: "csv" | "pdf") {
    try {
        const response = await axios.get(`/api/inscripciones/reportes`, {
            params: { ...params, format },
            responseType: "blob",
        });
        return { status: response.status, data: response.data as Blob };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: new Blob() };
    }
}

export async function downloadReceipt(id: number) {
    try {
        const response = await axios.get(`/api/inscripciones/comprobante?id=${id}`, {
            responseType: "blob",
        });
        return { status: response.status, data: response.data as Blob };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: new Blob() };
    }
}

export async function scheduleReport(payload: ReporteProgramadoPayload) {
    try {
        const response = await axios.post<ReporteProgramadoItem>("/api/inscripciones/reportes/schedule", payload);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { message: "Error de red o desconocido" } };
    }
}

export async function getReportSchedules() {
    try {
        const response = await axios.get<ReporteProgramadoItem[]>("/api/inscripciones/reportes/schedule");
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { message: "Error de red o desconocido" } };
    }
}
