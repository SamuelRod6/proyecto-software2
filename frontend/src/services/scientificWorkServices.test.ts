import axios from "axios";
import {
  assignScientificWorkReviewers,
  compareScientificWorkVersions,
  createScientificWork,
  decideScientificWork,
  downloadScientificWorkVersion,
  listScientificWorkEvaluations,
  listScientificWorkReviewers,
  listScientificWorkVersions,
  listScientificWorks,
  listScientificWorksForCommittee,
  listScientificWorksForReviewer,
  submitScientificWorkEvaluation,
  uploadScientificWorkVersion,
} from "./scientificWorkServices";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("scientificWorkServices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should list works by user", async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: [{ id_trabajo: 1 }] });

    const result = await listScientificWorks(8);

    expect(result).toEqual({ status: 200, data: [{ id_trabajo: 1 }] });
    expect(mockedAxios.get).toHaveBeenCalledWith("/api/trabajos-cientificos?user_id=8");
  });

  it("should create a scientific work with multipart data", async () => {
    const payload = new FormData();
    payload.append("id_usuario", "8");

    mockedAxios.post.mockResolvedValueOnce({ status: 201, data: { id_trabajo: 10 } });

    const result = await createScientificWork(payload);

    expect(result).toEqual({ status: 201, data: { id_trabajo: 10 } });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/api/trabajos-cientificos",
      payload,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  });

  it("should upload a new work version", async () => {
    const payload = new FormData();
    payload.append("id_trabajo", "10");

    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { ok: true } });

    const result = await uploadScientificWorkVersion(payload);

    expect(result).toEqual({ status: 200, data: { ok: true } });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/api/trabajos-cientificos/versiones",
      payload,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  });

  it("should list versions for one work", async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: [{ numero_version: 1 }] });

    const result = await listScientificWorkVersions(11, 8);

    expect(result).toEqual({ status: 200, data: [{ numero_version: 1 }] });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "/api/trabajos-cientificos/versiones?id_trabajo=11&user_id=8",
    );
  });

  it("should compare versions", async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { resumen: ["Cambio 1"] } });

    const result = await compareScientificWorkVersions(11, 8, 1, 2);

    expect(result).toEqual({ status: 200, data: { resumen: ["Cambio 1"] } });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "/api/trabajos-cientificos/versiones/comparar?id_trabajo=11&user_id=8&from=1&to=2",
    );
  });

  it("should download one version as blob", async () => {
    const blob = new Blob(["pdf"]);
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: blob });

    const result = await downloadScientificWorkVersion(15, 8);

    expect(result).toEqual({ status: 200, data: blob });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "/api/trabajos-cientificos/archivo?id_version=15&user_id=8",
      { responseType: "blob" },
    );
  });

  it("should build committee query params correctly", async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: [] });

    await listScientificWorksForCommittee({
      userId: 9,
      query: "  IA aplicada  ",
      autor: "  Laura  ",
      estado: "  EN_REVISION  ",
      idEvento: 4,
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "/api/trabajos-cientificos/comite?user_id=9&query=IA+aplicada&autor=Laura&estado=EN_REVISION&id_evento=4",
    );
  });

  it("should list works assigned to reviewer", async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: [{ id_trabajo: 1 }] });

    const result = await listScientificWorksForReviewer(20);

    expect(result).toEqual({ status: 200, data: [{ id_trabajo: 1 }] });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "/api/trabajos-cientificos/revisor/asignados?user_id=20",
    );
  });

  it("should list available reviewers", async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: [{ id_usuario: 2 }] });

    const result = await listScientificWorkReviewers(20);

    expect(result).toEqual({ status: 200, data: [{ id_usuario: 2 }] });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "/api/trabajos-cientificos/revisores?user_id=20",
    );
  });

  it("should assign reviewers to one work", async () => {
    const payload = { user_id: 20, id_trabajo: 4, revisores: [2, 3] };
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { ok: true } });

    const result = await assignScientificWorkReviewers(payload);

    expect(result).toEqual({ status: 200, data: { ok: true } });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/api/trabajos-cientificos/comite/asignar-revisores",
      payload,
    );
  });

  it("should list evaluations summary for a work", async () => {
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { cantidad_evaluaciones: 2 } });

    const result = await listScientificWorkEvaluations(20, 4);

    expect(result).toEqual({ status: 200, data: { cantidad_evaluaciones: 2 } });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "/api/trabajos-cientificos/comite/evaluaciones?user_id=20&id_trabajo=4",
    );
  });

  it("should register committee decision", async () => {
    const payload = {
      user_id: 20,
      id_trabajo: 4,
      decision_comite: "APROBADO",
      comentario_comite: "Aprobado con observaciones menores",
    };
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { ok: true } });

    const result = await decideScientificWork(payload);

    expect(result).toEqual({ status: 200, data: { ok: true } });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/api/trabajos-cientificos/comite/decision",
      payload,
    );
  });

  it("should submit evaluation as reviewer", async () => {
    const payload = {
      user_id: 20,
      id_trabajo: 4,
      recomendacion: "ACEPTAR",
      puntaje: 9,
      comentarios: "Muy buen trabajo",
      fortalezas: "Metodologia",
      debilidades: "Muestra pequena",
      recomendaciones: "Ampliar muestra",
    };
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { ok: true } });

    const result = await submitScientificWorkEvaluation(payload);

    expect(result).toEqual({ status: 200, data: { ok: true } });
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "/api/trabajos-cientificos/revisor/evaluar",
      payload,
    );
  });

  it("should normalize unknown errors with message key", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("Network Error"));

    const result = await listScientificWorks(1);

    expect(result).toEqual({ status: 500, data: { message: "Error de red o desconocido" } });
  });
});
