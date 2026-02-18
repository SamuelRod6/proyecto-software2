import axios from "axios";

export interface Inscripcion {
  id: number;
  evento_id: number;
  usuario_id: number;
  fecha: string;
  estado_pago: boolean;
  comprobante: string;
}

export async function getInscripciones({ eventoId, usuarioId }: { 
    eventoId?: number; 
    usuarioId?: number 
}): Promise<{ status: number; data: Inscripcion[] | any }> {
    try {
        let url = "/api/inscripciones";
        const params = [];
        if (eventoId) params.push(`evento_id=${eventoId}`);
        if (usuarioId) params.push(`usuario_id=${usuarioId}`);
        if (params.length > 0) url += "?" + params.join("&");

        const response = await axios.get<Inscripcion[]>(url);
        return { 
            status: response.status, 
            data: response.data 
        };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { error: "Error de red o desconocido" } };
    }
}

export async function inscribirEvento(data: {
    usuario_id: number;
    evento_id: number;
    comentario?: string;
    estado_pago?: boolean;
    comprobante?: string;
}): Promise<{ status: number; data: any }> {
    try {
        const response = await axios.post("/api/inscripciones", data);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { error: "Error de red o desconocido" } };
    }
}
