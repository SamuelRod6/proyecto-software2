/*
File: handler.go

Contains:
HTTP endpoint layer for the Trabajos module.
It routes work/version/review endpoints, parses request input,
and maps service responses to HTTP output.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
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

	"golang.org/x/text/encoding/charmap"
)

type Handler struct {
	svc *service.Service
}

// New creates a trabajos HTTP handler.
func New(client *db.PrismaClient) http.Handler {
    return &Handler{svc: service.New(client)}
}

// ServeHTTP dispatches requests by method and sub-path.
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
    case r.Method == http.MethodGet && path == "historial":
        h.historialTrabajo(w, r)
    case r.Method == http.MethodGet && path == "historial/pdf":
        h.downloadHistorialTrabajoPDF(w, r)
    default:
        http.NotFound(w, r)
    }
}

// parseCreateRequest parses multipart payload for create endpoint.
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

// parseVersionRequest parses multipart payload for version upload endpoint.
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

// parsePositiveInt parses and validates positive integer query values.
func parsePositiveInt(value string) (int, error) {
    n, err := strconv.Atoi(value)
    if err != nil || n <= 0 {
        return 0, errors.New("valor inválido")
    }
    return n, nil
}

func parseWorkHistoryFilters(r *http.Request) (map[string]interface{}, error) {
    filters := make(map[string]interface{})
    if value := strings.TrimSpace(r.URL.Query().Get("estado")); value != "" {
        filters["estado"] = value
    }
    if value := strings.TrimSpace(r.URL.Query().Get("tipo_cambio")); value != "" {
        filters["tipo_cambio"] = value
    }
    if value := strings.TrimSpace(r.URL.Query().Get("q")); value != "" {
        filters["q"] = value
    }
    if value := strings.TrimSpace(r.URL.Query().Get("desde")); value != "" {
        parsed, err := parseHistoryDate(value)
        if err != nil {
            return nil, err
        }
        filters["desde"] = parsed
    }
    if value := strings.TrimSpace(r.URL.Query().Get("hasta")); value != "" {
        parsed, err := parseHistoryDate(value)
        if err != nil {
            return nil, err
        }
        filters["hasta"] = parsed
    }
    return filters, nil
}

func parseHistoryDate(value string) (time.Time, error) {
    layouts := []string{"02/01/2006", "2006-01-02"}
    for _, layout := range layouts {
        if parsed, err := time.ParseInLocation(layout, value, time.UTC); err == nil {
            return parsed, nil
        }
    }
    return time.Time{}, errors.New("fecha inválida")
}

// writeServiceError maps service errors to HTTP responses.
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

/*
Endpoint: POST /api/trabajos-cientificos
Creates a new scientific work with initial PDF upload.
*/
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

/*
Endpoint: GET /api/trabajos-cientificos?user_id=<id>
Lists works submitted by the user.
*/
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

/*
Endpoint: POST /api/trabajos-cientificos/versiones
Uploads a new version for an existing work.
*/
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

/*
Endpoint: GET /api/trabajos-cientificos/versiones
Lists all versions of a work.
*/
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

/*
Endpoint: GET /api/trabajos-cientificos/versiones/comparar
Compares two versions of a work.
*/
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

/*
Endpoint: GET /api/trabajos-cientificos/archivo
Downloads one version file.
*/
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

/*
Endpoint: GET /api/trabajos-cientificos/comite
Lists works for committee view with filters.
*/
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

/*
Endpoint: GET /api/trabajos-cientificos/revisores
Lists available reviewers.
*/
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

/*
Endpoint: POST /api/trabajos-cientificos/comite/asignar-revisores
Assigns reviewers to a work.
*/
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

/*
Endpoint: GET /api/trabajos-cientificos/revisor/asignados
Lists works assigned to a reviewer.
*/
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

/*
Endpoint: POST /api/trabajos-cientificos/revisor/evaluar
Submits reviewer evaluation for a work.
*/
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

/*
Endpoint: GET /api/trabajos-cientificos/comite/evaluaciones
Returns evaluation summary for one work.
*/
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

/*
Endpoint: POST /api/trabajos-cientificos/comite/decision
Stores final committee decision for a work.
*/
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

func (h *Handler) historialTrabajo(w http.ResponseWriter, r *http.Request) {
    trabajoID, err := parsePositiveInt(r.URL.Query().Get("id_trabajo"))
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, "id_trabajo inválido")
        return
    }
    userID, err := parsePositiveInt(r.URL.Query().Get("user_id"))
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, "user_id inválido")
        return
    }

    filters, err := parseWorkHistoryFilters(r)
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
        return
    }

    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    rows, svcErr := h.svc.HistorialTrabajo(ctx, trabajoID, userID, filters)
    if svcErr != nil {
        writeServiceError(w, svcErr)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(rows)
}

func (h *Handler) downloadHistorialTrabajoPDF(w http.ResponseWriter, r *http.Request) {
    trabajoID, err := parsePositiveInt(r.URL.Query().Get("id_trabajo"))
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, "id_trabajo inválido")
        return
    }
    userID, err := parsePositiveInt(r.URL.Query().Get("user_id"))
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, "user_id inválido")
        return
    }

    filters, err := parseWorkHistoryFilters(r)
    if err != nil {
        httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
        return
    }

    ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
    defer cancel()

    rows, svcErr := h.svc.HistorialTrabajo(ctx, trabajoID, userID, filters)
    if svcErr != nil {
        writeServiceError(w, svcErr)
        return
    }

    writePDFTrabajoHistorial(w, rows)
}

func writePDFTrabajoHistorial(w http.ResponseWriter, rows []dto.WorkStatusHistoryItem) {
    lines := []string{"Historial de cambios de estado de trabajo científico", ""}
    if len(rows) == 0 {
        lines = append(lines, "No hay cambios registrados")
    } else {
        for _, row := range rows {
            lines = append(lines,
                fmt.Sprintf("Fecha: %s", row.FechaCambio),
                fmt.Sprintf("Cambio: %s -> %s", valueOrDefault(row.EstadoAnterior, "-"), valueOrDefault(row.EstadoNuevo, "-")),
                fmt.Sprintf("Tipo: %s", valueOrDefault(row.TipoCambio, "-")),
                fmt.Sprintf("Actor: %s", valueOrDefault(row.Actor, "Sin actor")),
                fmt.Sprintf("Comentario: %s", valueOrDefault(row.Nota, "Sin comentarios")),
                "",
            )
        }
    }

    pdf := buildSimplePDF(lines)
    w.Header().Set("Content-Type", "application/pdf")
    w.Header().Set("Content-Disposition", "attachment; filename=historial_trabajo_cientifico.pdf")
    w.WriteHeader(http.StatusOK)
    _, _ = w.Write(pdf)
}

func valueOrDefault(value, fallback string) string {
    if strings.TrimSpace(value) == "" {
        return fallback
    }
    return value
}

func buildSimplePDF(lines []string) []byte {
    content := "BT /F1 12 Tf 72 720 Td 16 TL"
    for _, line := range lines {
        safe := encodePDFText(line)
        content += fmt.Sprintf(" (%s) Tj T*", safe)
    }
    content += " ET"

    objects := []string{
        "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
        "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
        "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
        fmt.Sprintf("4 0 obj << /Length %d >> stream\n%s\nendstream endobj", len(content), content),
        "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> endobj",
    }

    var xref strings.Builder
    xref.WriteString("xref\n0 6\n0000000000 65535 f \n")

    var body strings.Builder
    body.WriteString("%PDF-1.4\n")
    offsets := []int{0}
    for _, obj := range objects {
        offsets = append(offsets, body.Len())
        body.WriteString(obj + "\n")
    }

    for i := 1; i < len(offsets); i++ {
        xref.WriteString(fmt.Sprintf("%010d 00000 n \n", offsets[i]))
    }

    startXref := body.Len()
    trailer := fmt.Sprintf("trailer << /Size 6 /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF", startXref)

    final := body.String() + xref.String() + trailer
    return []byte(final)
}

func encodePDFText(value string) string {
    encoded, err := charmap.Windows1252.NewEncoder().String(value)
    if err != nil {
        encoded = value
    }
    replacer := strings.NewReplacer("\\", "\\\\", "(", "\\(", ")", "\\)")
    return replacer.Replace(encoded)
}