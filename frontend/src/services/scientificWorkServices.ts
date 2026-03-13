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

export interface ScientificWorkManagementItem {
  id_trabajo: number;
  id_evento: number;
  id_autor: number;
  autor: string;
  titulo: string;
  resumen: string;
  estado: string;
  decision_comite: string;
  fecha_ultimo_envio: string;
  version_actual: number;
  archivo_actual?: {
    id_version: number;
    nombre_archivo?: string;
  };
}

export interface ScientificWorkReviewerItem {
  id_usuario: number;
  nombre: string;
  email: string;
}

export interface ScientificWorkEvaluationItem {
  id_evaluacion: number;
  id_trabajo: number;
  id_revisor: number;
  revisor: string;
  recomendacion: string;
  puntaje?: number;
  comentarios: string;
  updated_at: string;
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

export async function listScientificWorksForCommittee(params: {
  userId: number;
  query?: string;
  autor?: string;
  estado?: string;
  idEvento?: number;
}): Promise<{ status: number; data: any }> {
  try {
    const query = new URLSearchParams();
    query.set("user_id", String(params.userId));
    if (params.query?.trim()) query.set("query", params.query.trim());
    if (params.autor?.trim()) query.set("autor", params.autor.trim());
    if (params.estado?.trim()) query.set("estado", params.estado.trim());
    if (params.idEvento && params.idEvento > 0) query.set("id_evento", String(params.idEvento));

    const response = await axios.get(`/api/trabajos-cientificos/comite?${query.toString()}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { message: "Error de red o desconocido" } };
  }
}

export async function listScientificWorksForReviewer(userId: number): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.get(`/api/trabajos-cientificos/revisor/asignados?user_id=${userId}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { message: "Error de red o desconocido" } };
  }
}

export async function listScientificWorkReviewers(userId: number): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.get(`/api/trabajos-cientificos/revisores?user_id=${userId}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { message: "Error de red o desconocido" } };
  }
}

export async function assignScientificWorkReviewers(payload: {
  user_id: number;
  id_trabajo: number;
  revisores: number[];
}): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.post("/api/trabajos-cientificos/comite/asignar-revisores", payload);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { message: "Error de red o desconocido" } };
  }
}

export async function listScientificWorkEvaluations(
  userId: number,
  workId: number,
): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.get(
      `/api/trabajos-cientificos/comite/evaluaciones?user_id=${userId}&id_trabajo=${workId}`,
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { message: "Error de red o desconocido" } };
  }
}

export async function decideScientificWork(payload: {
  user_id: number;
  id_trabajo: number;
  decision_comite: string;
  comentario_comite: string;
}): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.post("/api/trabajos-cientificos/comite/decision", payload);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { message: "Error de red o desconocido" } };
  }
}

export async function submitScientificWorkEvaluation(payload: {
  user_id: number;
  id_trabajo: number;
  recomendacion: string;
  puntaje?: number;
  comentarios: string;
}): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.post("/api/trabajos-cientificos/revisor/evaluar", payload);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { message: "Error de red o desconocido" } };
  }
}