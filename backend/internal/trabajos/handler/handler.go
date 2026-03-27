package handler

import (
	"context"
	"encoding/json"
    "errors"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"project/backend/internal/shared/httperror"
	"project/backend/internal/trabajos/dto"
	"project/backend/internal/trabajos/service"
	"project/backend/internal/trabajos/validation"
	"project/backend/prisma/db"
)

type Handler struct {
	svc *service.Service
}

func New(client *db.PrismaClient) http.Handler {
    return &Handler{svc: service.New(client)}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    path := strings.TrimPrefix(r.URL.Path, "/api/trabajos-cientificos")
    path = strings.TrimPrefix(path, "/")

    switch {
    case r.Method == http.MethodPost && path == "":
        h.createTrabajo(w, r)
    case r.Method == http.MethodGet && path == "":
        h.listTrabajos(w, r)
    case r.Method == http.MethodPost && path == "versiones":
        h.addVersion(w, r)
    case r.Method == http.MethodGet && path == "versiones":
        h.listVersiones(w, r)
    case r.Method == http.MethodGet && path == "versiones/comparar":
        h.compareVersiones(w, r)
    case r.Method == http.MethodGet && path == "archivo":
        h.downloadArchivo(w, r)
    case r.Method == http.MethodGet && path == "comite":
        h.listTrabajosComite(w, r)
    case r.Method == http.MethodGet && path == "revisores":
        h.listRevisores(w, r)
    case r.Method == http.MethodPost && path == "comite/asignar-revisores":
        h.assignReviewers(w, r)
    case r.Method == http.MethodGet && path == "revisor/asignados":
        h.listTrabajosRevisor(w, r)
    case r.Method == http.MethodPost && path == "revisor/evaluar":
        h.submitEvaluation(w, r)
    case r.Method == http.MethodGet && path == "comite/evaluaciones":
        h.listEvaluacionesByTrabajo(w, r)
    case r.Method == http.MethodPost && path == "comite/decision":
        h.decideTrabajo(w, r)
    default:
        http.NotFound(w, r)
    }
}

func (h *Handler) createTrabajo(w http.ResponseWriter, r *http.Request) {
    req, file, err := parseCreateRequest(r)
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
        return
    }

    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    res, err := h.svc.CreateTrabajo(ctx, req, file)
    if err != nil {
        status := http.StatusBadRequest
        if err == service.ErrTrabajoDuplicado {
            status = http.StatusConflict
        }
        httperror.WriteJSON(w, status, err.Error())
        return
    }

    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(res)
}

func (h *Handler) listTrabajos(w http.ResponseWriter, r *http.Request) {
    userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
    if err != nil || userID <= 0 {
        httperror.WriteJSON(w, http.StatusBadRequest, "user_id inválido")
        return
    }

    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    rows, err := h.svc.ListTrabajosByUser(ctx, userID)
    if err != nil {
        httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
        return
    }

    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) addVersion(w http.ResponseWriter, r *http.Request) {
    req, file, err := parseVersionRequest(r)
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
        return
    }

    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    res, err := h.svc.AddVersion(ctx, req, file)
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
        return
    }

    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(res)
}

func (h *Handler) listVersiones(w http.ResponseWriter, r *http.Request) {
    trabajoID, err := strconv.Atoi(r.URL.Query().Get("id_trabajo"))
    if err != nil || trabajoID <= 0 {
        httperror.WriteJSON(w, http.StatusBadRequest, "id_trabajo inválido")
        return
    }
    userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
    if err != nil || userID <= 0 {
        httperror.WriteJSON(w, http.StatusBadRequest, "user_id inválido")
        return
    }

    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    rows, err := h.svc.ListVersiones(ctx, trabajoID, userID)
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
        return
    }

    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) compareVersiones(w http.ResponseWriter, r *http.Request) {
    trabajoID, err := strconv.Atoi(r.URL.Query().Get("id_trabajo"))
    if err != nil || trabajoID <= 0 {
        httperror.WriteJSON(w, http.StatusBadRequest, "id_trabajo inválido")
        return
    }
    userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
    if err != nil || userID <= 0 {
        httperror.WriteJSON(w, http.StatusBadRequest, "user_id inválido")
        return
    }
    from, err := strconv.Atoi(r.URL.Query().Get("from"))
    if err != nil || from <= 0 {
        httperror.WriteJSON(w, http.StatusBadRequest, "from inválido")
        return
    }
    to, err := strconv.Atoi(r.URL.Query().Get("to"))
    if err != nil || to <= 0 {
        httperror.WriteJSON(w, http.StatusBadRequest, "to inválido")
        return
    }

    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    res, err := h.svc.CompareVersiones(ctx, trabajoID, userID, from, to)
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
        return
    }

	w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(res)
}

func (h *Handler) downloadArchivo(w http.ResponseWriter, r *http.Request) {
    versionID, err := strconv.Atoi(r.URL.Query().Get("id_version"))
    if err != nil || versionID <= 0 {
        httperror.WriteJSON(w, http.StatusBadRequest, "id_version inválido")
        return
    }
    userID, err := strconv.Atoi(r.URL.Query().Get("user_id"))
    if err != nil || userID <= 0 {
        httperror.WriteJSON(w, http.StatusBadRequest, "user_id inválido")
        return
    }

    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    version, err := h.svc.GetVersionFile(ctx, versionID, userID)
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
        return
    }

    w.Header().Set("Content-Type", version.MimeType)
    w.Header().Set("Content-Disposition", `attachment; filename="`+version.NombreArchivo+`"`)
    http.ServeFile(w, r, version.RutaArchivo)
}

func parseCreateRequest(r *http.Request) (dto.CreateTrabajoRequest, dto.UploadedFile, error) {
    var req dto.CreateTrabajoRequest
    var file dto.UploadedFile

    if err := r.ParseMultipartForm(validation.MaxPDFSize + (1 << 20)); err != nil {
        return req, file, err
    }

    req.IDEvento, _ = strconv.Atoi(r.FormValue("id_evento"))
    req.IDUsuario, _ = strconv.Atoi(r.FormValue("id_usuario"))
    req.Titulo = r.FormValue("titulo")
    req.Resumen = r.FormValue("resumen")
    req.DeclaraNoConfidencial = strings.EqualFold(r.FormValue("declara_no_confidencial"), "true")
    req.DescripcionCambios = r.FormValue("descripcion_cambios")

    src, header, err := r.FormFile("archivo")
    if err != nil {
        return req, file, validation.ErrArchivoRequerido
    }
    defer src.Close()

    if err := validation.ValidatePDFHeader(header); err != nil {
        return req, file, err
    }

    content, err := io.ReadAll(io.LimitReader(src, validation.MaxPDFSize+1))
    if err != nil {
        return req, file, err
    }

	contentType := service.DetectPDFContentType(content)
    file = dto.UploadedFile{
        FileName:    header.Filename,
        ContentType: contentType,
        Size:        int64(len(content)),
        Bytes:       content,
    }

    return req, file, nil
}

func parseVersionRequest(r *http.Request) (dto.AddVersionRequest, dto.UploadedFile, error) {
    var req dto.AddVersionRequest
    var file dto.UploadedFile

    if err := r.ParseMultipartForm(validation.MaxPDFSize + (1 << 20)); err != nil {
        return req, file, err
    }

    req.IDTrabajo, _ = strconv.Atoi(r.FormValue("id_trabajo"))
    req.IDUsuario, _ = strconv.Atoi(r.FormValue("id_usuario"))
    req.DescripcionCambios = r.FormValue("descripcion_cambios")

    src, header, err := r.FormFile("archivo")
    if err != nil {
        return req, file, validation.ErrArchivoRequerido
    }
    defer src.Close()

    if err := validation.ValidatePDFHeader(header); err != nil {
        return req, file, err
    }

    content, err := io.ReadAll(io.LimitReader(src, validation.MaxPDFSize+1))
    if err != nil {
        return req, file, err
    }

	contentType := service.DetectPDFContentType(content)
    file = dto.UploadedFile{
        FileName:    header.Filename,
        ContentType: contentType,
        Size:        int64(len(content)),
        Bytes:       content,
    }

    return req, file, nil
}

func parsePositiveInt(value string) (int, error) {
    n, err := strconv.Atoi(value)
    if err != nil || n <= 0 {
        return 0, errors.New("valor inválido")
    }
    return n, nil
}

func writeServiceError(w http.ResponseWriter, err error) {
    switch {
    case errors.Is(err, service.ErrSinAcceso):
        httperror.WriteJSON(w, http.StatusForbidden, err.Error())
    case errors.Is(err, service.ErrTrabajoNoExiste):
        httperror.WriteJSON(w, http.StatusNotFound, err.Error())
    default:
        httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
    }
}

func (h *Handler) listTrabajosComite(w http.ResponseWriter, r *http.Request) {
    userID, err := parsePositiveInt(r.URL.Query().Get("user_id"))
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, "user_id inválido")
        return
    }

    var idEvento int
    if raw := strings.TrimSpace(r.URL.Query().Get("id_evento")); raw != "" {
        idEvento, err = parsePositiveInt(raw)
        if err != nil {
            httperror.WriteJSON(w, http.StatusBadRequest, "id_evento inválido")
            return
        }
    }

    filter := dto.TrabajoComiteFilter{
        UserID:   userID,
        Query:    strings.TrimSpace(r.URL.Query().Get("query")),
        Autor:    strings.TrimSpace(r.URL.Query().Get("autor")),
        Estado:   strings.TrimSpace(r.URL.Query().Get("estado")),
        IDEvento: idEvento,
    }

    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    rows, svcErr := h.svc.ListTrabajosComite(ctx, filter)
    if svcErr != nil {
        writeServiceError(w, svcErr)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) listRevisores(w http.ResponseWriter, r *http.Request) {
    userID, err := parsePositiveInt(r.URL.Query().Get("user_id"))
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, "user_id inválido")
        return
    }

    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    rows, svcErr := h.svc.ListRevisores(ctx, userID)
    if svcErr != nil {
        writeServiceError(w, svcErr)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) assignReviewers(w http.ResponseWriter, r *http.Request) {
    var req dto.AssignReviewersRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, "json inválido")
        return
    }

    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    if svcErr := h.svc.AssignReviewers(ctx, req); svcErr != nil {
        writeServiceError(w, svcErr)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) listTrabajosRevisor(w http.ResponseWriter, r *http.Request) {
    userID, err := parsePositiveInt(r.URL.Query().Get("user_id"))
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, "user_id inválido")
        return
    }

    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    rows, svcErr := h.svc.ListTrabajosAsignadosRevisor(ctx, userID)
    if svcErr != nil {
        writeServiceError(w, svcErr)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) submitEvaluation(w http.ResponseWriter, r *http.Request) {
    var req dto.SubmitEvaluationRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, "json inválido")
        return
    }

    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    if svcErr := h.svc.SubmitEvaluation(ctx, req); svcErr != nil {
        writeServiceError(w, svcErr)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) listEvaluacionesByTrabajo(w http.ResponseWriter, r *http.Request) {
    userID, err := parsePositiveInt(r.URL.Query().Get("user_id"))
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, "user_id inválido")
        return
    }
    trabajoID, err := parsePositiveInt(r.URL.Query().Get("id_trabajo"))
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, "id_trabajo inválido")
        return
    }

    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    rows, svcErr := h.svc.ListEvaluacionesByTrabajo(ctx, userID, trabajoID)
    if svcErr != nil {
        writeServiceError(w, svcErr)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) decideTrabajo(w http.ResponseWriter, r *http.Request) {
    var req dto.DecisionRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, "json inválido")
        return
    }

    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    if svcErr := h.svc.DecideTrabajo(ctx, req); svcErr != nil {
        writeServiceError(w, svcErr)
        return
    }

    w.WriteHeader(http.StatusNoContent)
}