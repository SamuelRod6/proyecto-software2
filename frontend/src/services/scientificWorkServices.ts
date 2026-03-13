import axios from "axios";

export interface ScientificWorkVersion {
  id_version: number;
  id_trabajo: number;
  numero_version: number;
  nombre_archivo: string;
  tamano_bytes: number;
  mime_type: string;
  descripcion_cambios: string;
  es_actual: boolean;
  fecha_envio: string;
}

export interface ScientificWorkItem {
  id_trabajo: number;
  id_evento: number;
  id_usuario: number;
  titulo: string;
  resumen: string;
  version_actual: number;
  estado: string;
  fecha_ultimo_envio: string;
  archivo_actual?: ScientificWorkVersion;
}

export interface ScientificWorkCompare {
  id_trabajo: number;
  from: ScientificWorkVersion;
  to: ScientificWorkVersion;
  resumen: string[];
}

export async function listScientificWorks(userId: number): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.get(`/api/trabajos-cientificos?user_id=${userId}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { message: "Error de red o desconocido" } };
  }
}

export async function createScientificWork(payload: FormData): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.post("/api/trabajos-cientificos", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { message: "Error de red o desconocido" } };
  }
}

export async function uploadScientificWorkVersion(payload: FormData): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.post("/api/trabajos-cientificos/versiones", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { message: "Error de red o desconocido" } };
  }
}

export async function listScientificWorkVersions(workId: number, userId: number): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.get(`/api/trabajos-cientificos/versiones?id_trabajo=${workId}&user_id=${userId}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { message: "Error de red o desconocido" } };
  }
}

export async function compareScientificWorkVersions(workId: number, userId: number, from: number, to: number): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.get(
      `/api/trabajos-cientificos/versiones/comparar?id_trabajo=${workId}&user_id=${userId}&from=${from}&to=${to}`,
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { message: "Error de red o desconocido" } };
  }
}

export async function downloadScientificWorkVersion(versionId: number, userId: number): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.get(
      `/api/trabajos-cientificos/archivo?id_version=${versionId}&user_id=${userId}`,
      { responseType: "blob" },
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { message: "Error de red o desconocido" } };
  }
}