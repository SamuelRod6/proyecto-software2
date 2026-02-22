package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"project/backend/internal/inscripciones/dto"
	"project/backend/internal/inscripciones/repo"
	"project/backend/internal/inscripciones/service"
	"project/backend/internal/inscripciones/validation"
	"project/backend/internal/shared/httperror"
	"project/backend/prisma/db"
	"golang.org/x/text/encoding/charmap"
)

type Handler struct {
	svc *service.Service
}

func New(client *db.PrismaClient) *Handler {
	repository := repo.New(client)
	return &Handler{svc: service.New(repository)}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		h.createInscripcion(w, r)
	case http.MethodGet:
		h.listInscripciones(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) UpdateEstadoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPatch {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req dto.UpdateEstadoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "json inválido")
		return
	}

	if req.IDInscripcion == 0 || strings.TrimSpace(req.Estado) == "" {
		httperror.WriteJSON(w, http.StatusBadRequest, "id_inscripcion y estado son requeridos")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	if err := h.svc.UpdateEstado(ctx, req); err != nil {
		switch {
		case errors.Is(err, service.ErrEstadoInvalido):
			httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
			return
		case errors.Is(err, service.ErrInscripcionNotFound):
			httperror.WriteJSON(w, http.StatusNotFound, err.Error())
			return
		default:
			httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Estado actualizado"})
}

func (h *Handler) HistorialHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		httperror.WriteJSON(w, http.StatusBadRequest, "id inválido")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	rows, err := h.svc.Historial(ctx, id)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	res := make([]dto.HistorialResponse, 0, len(rows))
	for _, row := range rows {
		res = append(res, dto.HistorialResponse{
			IDHistorial:    row.IDHistorial,
			IDInscripcion:  row.IDInscripcion,
			EstadoAnterior: row.EstadoAnterior,
			EstadoNuevo:    row.EstadoNuevo,
			Nota:           row.Nota,
			Actor:          row.Actor,
			FechaCambio:    row.FechaCambio,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func (h *Handler) PreferenciasHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.getPreferencias(w, r)
	case http.MethodPut:
		h.updatePreferencias(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) getPreferencias(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("user_id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		httperror.WriteJSON(w, http.StatusBadRequest, "user_id inválido")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	pref, err := h.svc.GetPreferencias(ctx, id)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(dto.PreferenciasResponse{
		IDUsuario:  pref.IDUsuario,
		Frecuencia: pref.Frecuencia,
		Tipos:      pref.Tipos,
		Habilitado: pref.Habilitado,
	})
}

func (h *Handler) updatePreferencias(w http.ResponseWriter, r *http.Request) {
	var req dto.PreferenciasRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "json inválido")
		return
	}

	if req.IDUsuario <= 0 {
		httperror.WriteJSON(w, http.StatusBadRequest, "id_usuario es requerido")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	pref, err := h.svc.UpdatePreferencias(ctx, req)
	if err != nil {
		if errors.Is(err, service.ErrPreferenciasInvalid) {
			httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
			return
		}
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(dto.PreferenciasResponse{
		IDUsuario:  pref.IDUsuario,
		Frecuencia: pref.Frecuencia,
		Tipos:      pref.Tipos,
		Habilitado: pref.Habilitado,
	})
}

func (h *Handler) NotificacionesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.URL.Query().Get("user_id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		httperror.WriteJSON(w, http.StatusBadRequest, "user_id inválido")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	rows, err := h.svc.Notificaciones(ctx, id)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	res := make([]dto.NotificacionResponse, 0, len(rows))
	for _, row := range rows {
		res = append(res, dto.NotificacionResponse{
			IDNotificacion: row.IDNotificacion,
			IDUsuario:      row.IDUsuario,
			IDInscripcion:  row.IDInscripcion,
			Canal:          row.Canal,
			Asunto:         row.Asunto,
			Mensaje:        row.Mensaje,
			FechaEnvio:     row.FechaEnvio,
			Estado:         row.Estado,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func (h *Handler) ComprobanteHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		httperror.WriteJSON(w, http.StatusBadRequest, "id inválido")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	rows, err := h.svc.ListInscripciones(ctx, map[string]interface{}{"id_inscripcion": id})
	if err != nil || len(rows) == 0 {
		httperror.WriteJSON(w, http.StatusNotFound, "inscripción no encontrada")
		return
	}

	row := rows[0]
	lines := []string{
		"Comprobante de inscripción",
		"",
		"Evento: " + row.EventoNombre,
		"Participante: " + row.Nombre,
		"Correo: " + row.Email,
		"Afiliación: " + row.Afiliacion,
		"Fecha inscripción: " + row.FechaInscripcion,
		"Estado: " + row.Estado,
	}

	pdf := buildSimplePDF(lines)

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=comprobante_inscripcion.pdf")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(pdf)
}

func (h *Handler) ReportesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	filters, err := parseReportFilters(r)
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	porEstado, total, err := h.svc.Reporte(ctx, filters)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, err.Error())
		return
	}

	rows, err := h.svc.ListInscripciones(ctx, filters)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, err.Error())
		return
	}

	resRows := make([]dto.InscripcionResponse, 0, len(rows))
	for _, row := range rows {
		resRows = append(resRows, dto.InscripcionResponse{
			IDInscripcion:      row.IDInscripcion,
			IDEvento:           row.IDEvento,
			EventoNombre:       row.EventoNombre,
			IDUsuario:          row.IDUsuario,
			NombreParticipante: row.Nombre,
			Email:              row.Email,
			Afiliacion:         row.Afiliacion,
			ComprobantePago:    row.ComprobantePago,
			FechaInscripcion:   row.FechaInscripcion,
			FechaLimitePago:    row.FechaLimitePago,
			Estado:             row.Estado,
		})
	}

	format := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("format")))
	if format == "csv" {
		writeCSVReport(w, porEstado, total)
		return
	}
	if format == "pdf" {
		writePDFReport(w, porEstado, total)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(dto.ReporteResponse{
		Total:     total,
		PorEstado: porEstado,
		Registros: resRows,
	})
}

func (h *Handler) ReportesProgramadosHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.listReportesProgramados(w, r)
	case http.MethodPost:
		h.createReporteProgramado(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) listReportesProgramados(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	rows, err := h.svc.ReportesProgramados(ctx)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	res := make([]dto.ReporteProgramadoResponse, 0, len(rows))
	for _, row := range rows {
		res = append(res, dto.ReporteProgramadoResponse{
			IDReporte:  row.IDReporte,
			IDEvento:   row.IDEvento,
			Estado:     row.Estado,
			Frecuencia: row.Frecuencia,
			Formato:    row.Formato,
			CreadoPor:  row.CreadoPor,
			CreadoEn:   row.CreadoEn,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func (h *Handler) createReporteProgramado(w http.ResponseWriter, r *http.Request) {
	var req dto.ReporteProgramadoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "json inválido")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()

	created, err := h.svc.CrearReporteProgramado(ctx, req)
	if err != nil {
		if errors.Is(err, service.ErrPreferenciasInvalid) {
			httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
			return
		}
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(dto.ReporteProgramadoResponse{
		IDReporte:  created.IDReporte,
		IDEvento:   created.IDEvento,
		Estado:     created.Estado,
		Frecuencia: created.Frecuencia,
		Formato:    created.Formato,
		CreadoPor:  created.CreadoPor,
		CreadoEn:   created.CreadoEn,
	})
}

func (h *Handler) createInscripcion(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateInscripcionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "json inválido")
		return
	}

	if req.IDEvento == 0 || req.IDUsuario == 0 {
		httperror.WriteJSON(w, http.StatusBadRequest, "id_evento e id_usuario son requeridos")
		return
	}
	if err := validation.ValidateNombre(req.NombreParticipante); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := validation.ValidateEmail(req.Email); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := validation.ValidateAfiliacion(req.Afiliacion); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := validateComprobante(req.ComprobantePago); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	id, err := h.svc.CreateInscripcion(ctx, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrEventoNotFound):
			httperror.WriteJSON(w, http.StatusNotFound, err.Error())
			return
		case errors.Is(err, service.ErrEventoCerrado):
			httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
			return
		case errors.Is(err, service.ErrUsuarioNotFound):
			httperror.WriteJSON(w, http.StatusNotFound, err.Error())
			return
		case errors.Is(err, service.ErrInscripcionExists):
			httperror.WriteJSON(w, http.StatusConflict, err.Error())
			return
		default:
			httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]int{"id_inscripcion": id})
}

func validateComprobante(value string) error {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	if len(trimmed) > 5_000_000 {
		return errors.New("El comprobante no debe superar 2MB")
	}
	if !strings.HasPrefix(trimmed, "data:application/pdf") &&
		!strings.HasPrefix(trimmed, "data:image/png") &&
		!strings.HasPrefix(trimmed, "data:image/jpeg") {
		return errors.New("El comprobante debe ser PDF o imagen")
	}
	return nil
}

func (h *Handler) listInscripciones(w http.ResponseWriter, r *http.Request) {
	filters, err := parseListFilters(r)
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	rows, err := h.svc.ListInscripciones(ctx, filters)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, "db error")
		return
	}

	res := make([]dto.InscripcionResponse, 0, len(rows))
	for _, row := range rows {
		res = append(res, dto.InscripcionResponse{
			IDInscripcion:      row.IDInscripcion,
			IDEvento:           row.IDEvento,
			EventoNombre:       row.EventoNombre,
			IDUsuario:          row.IDUsuario,
			NombreParticipante: row.Nombre,
			Email:              row.Email,
			Afiliacion:         row.Afiliacion,
			ComprobantePago:    row.ComprobantePago,
			FechaInscripcion:   row.FechaInscripcion,
			FechaLimitePago:    row.FechaLimitePago,
			Estado:             row.Estado,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func parseListFilters(r *http.Request) (map[string]interface{}, error) {
	filters := map[string]interface{}{}

	if userIDStr := strings.TrimSpace(r.URL.Query().Get("user_id")); userIDStr != "" {
		id, err := strconv.Atoi(userIDStr)
		if err != nil || id <= 0 {
			return nil, fmt.Errorf("user_id inválido")
		}
		filters["id_usuario"] = id
	}

	if eventoStr := strings.TrimSpace(r.URL.Query().Get("evento_id")); eventoStr != "" {
		id, err := strconv.Atoi(eventoStr)
		if err != nil || id <= 0 {
			return nil, fmt.Errorf("evento_id inválido")
		}
		filters["id_evento"] = id
	}

	if estado := strings.TrimSpace(r.URL.Query().Get("estado")); estado != "" {
		filters["estado"] = validation.NormalizeStatus(estado)
	}

	if q := strings.TrimSpace(r.URL.Query().Get("q")); q != "" {
		filters["q"] = q
	}

	loc := time.Now().Location()
	if desde := strings.TrimSpace(r.URL.Query().Get("desde")); desde != "" {
		parsed, err := validation.ParseDate(desde, loc)
		if err != nil {
			return nil, fmt.Errorf("fecha desde inválida")
		}
		filters["desde"] = parsed
	}

	if hasta := strings.TrimSpace(r.URL.Query().Get("hasta")); hasta != "" {
		parsed, err := validation.ParseDate(hasta, loc)
		if err != nil {
			return nil, fmt.Errorf("fecha hasta inválida")
		}
		filters["hasta"] = parsed
	}

	return filters, nil
}

func parseReportFilters(r *http.Request) (map[string]interface{}, error) {
	return parseListFilters(r)
}

func writeCSVReport(w http.ResponseWriter, porEstado map[string]int, total int) {
	var builder strings.Builder
	builder.WriteString("estado,total\n")
	for estado, count := range porEstado {
		builder.WriteString(fmt.Sprintf("%s,%d\n", estado, count))
	}
	builder.WriteString(fmt.Sprintf("TOTAL,%d\n", total))

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=reportes_inscripciones.csv")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(builder.String()))
}

func writePDFReport(w http.ResponseWriter, porEstado map[string]int, total int) {
	lines := []string{"Reporte de inscripciones", ""}
	for estado, count := range porEstado {
		lines = append(lines, fmt.Sprintf("%s: %d", estado, count))
	}
	lines = append(lines, fmt.Sprintf("Total: %d", total))

	pdf := buildSimplePDF(lines)
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", "attachment; filename=reportes_inscripciones.pdf")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(pdf)
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
