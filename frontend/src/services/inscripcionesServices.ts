import axios from "axios";

export interface Inscripcion {
  id: number;
  evento_id: number;
  usuario_id: number;
  fecha: string;
  estado_pago: boolean;
  comprobante: string;
}

export async function getInscripciones({
    eventoId,
    usuarioId,
    searchTerm,
    countryTerm,
    cityTerm,
    fromDate,
    toDate,
}: {
    eventoId?: number; 
    usuarioId?: number;
    searchTerm?: string;
    countryTerm?: string;
    cityTerm?: string;
    fromDate?: string;
    toDate?: string;
}): Promise<{ status: number; data: Inscripcion[] | any }> {
    try {
        let url = "/api/inscripciones";
        const params = [];
        if (eventoId) params.push(`evento_id=${eventoId}`);
        if (usuarioId) params.push(`usuario_id=${usuarioId}`);
        if (searchTerm) params.push(`searchTerm=${encodeURIComponent(searchTerm)}`);
        if (countryTerm) params.push(`countryTerm=${encodeURIComponent(countryTerm)}`);
        if (cityTerm) params.push(`cityTerm=${encodeURIComponent(cityTerm)}`);
        if (fromDate) params.push(`fromDate=${encodeURIComponent(fromDate)}`);
        if (toDate) params.push(`toDate=${encodeURIComponent(toDate)}`);
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
    id_usuario: number;
    id_evento: number;
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
