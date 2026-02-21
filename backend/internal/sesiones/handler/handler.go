package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"project/backend/internal/sesiones/dto"
	"project/backend/internal/sesiones/service"

	db "project/backend/prisma/db"
)

type Handler struct {
	svc *service.Service
}

func New(prismaClient interface{}) http.Handler {
	return &Handler{svc: service.New(prismaClient.(*db.PrismaClient))}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	path := strings.TrimPrefix(r.URL.Path, "/api/sesiones")
	path = strings.TrimPrefix(path, "/")

	if r.Method == http.MethodGet && path == "" && r.URL.Query().Get("sesion_id") != "" {
		h.ObtenerSesionPorQueryHandler(w, r.WithContext(ctx))
		return
	}
	if r.Method == http.MethodPut && path == "" && r.URL.Query().Get("sesion_id") != "" {
		h.ActualizarSesionPorQueryHandler(w, r.WithContext(ctx))
		return
	}
	if r.Method == http.MethodDelete && path == "" && r.URL.Query().Get("sesion_id") != "" {
		h.EliminarSesionPorQueryHandler(w, r.WithContext(ctx))
		return
	}
	if r.Method == http.MethodPost && path == "asignar-ponentes" && r.URL.Query().Get("sesion_id") != "" {
		h.AsignarPonentesPorQueryHandler(w, r.WithContext(ctx))
		return
	}
	if r.Method == http.MethodPost && path == "quitar-ponente" && r.URL.Query().Get("sesion_id") != "" && r.URL.Query().Get("usuario") != "" {
		h.QuitarPonentePorQueryHandler(w, r.WithContext(ctx))
		return
	}
	if r.Method == http.MethodGet && path == "ponentes" && r.URL.Query().Get("sesion_id") != "" {
		h.ListarPonentesPorQueryHandler(w, r.WithContext(ctx))
		return
	}
	if r.Method == http.MethodGet && path == "ponibles" && r.URL.Query().Get("sesion_id") != "" {
		h.ListarPonentesAsignablesPorQueryHandler(w, r.WithContext(ctx))
		return
	}
	switch {
	case r.Method == http.MethodPost && path == "":
		h.CrearSesionHandler(w, r.WithContext(ctx))
	case r.Method == http.MethodGet && path == "":
		h.ListarSesionesHandler(w, r.WithContext(ctx))
	default:
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte("Not found"))
	}
}

// PUT /api/sesiones?sesion_id={id}
func (h *Handler) ActualizarSesionPorQueryHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("sesion_id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		resp := map[string]string{"message": "id inválido"}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	var req dto.UpdateSesionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		resp := map[string]string{"message": "json inválido"}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	req.IDSesion = id
	resp, err := h.svc.UpdateSesion(r.Context(), id, req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		resp := map[string]string{"message": err.Error()}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	data, _ := json.MarshalIndent(resp, "", "  ")
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// DELETE /api/sesiones?sesion_id={id}
func (h *Handler) EliminarSesionPorQueryHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("sesion_id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		resp := map[string]string{"message": "id inválido"}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	err = h.svc.DeleteSesion(r.Context(), id)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		resp := map[string]string{"message": err.Error()}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// POST /api/sesiones/asignar-ponentes?sesion_id={id}
func (h *Handler) AsignarPonentesPorQueryHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("sesion_id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		resp := map[string]string{"message": "id inválido"}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	var req dto.AsignarPonentesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		resp := map[string]string{"message": "json inválido"}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	err = h.svc.AsignarPonentes(r.Context(), id, req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		resp := map[string]string{"message": err.Error()}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// POST /api/sesiones/quitar-ponente?sesion_id={id}&usuario={idUsuario}
func (h *Handler) QuitarPonentePorQueryHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("sesion_id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		resp := map[string]string{"message": "id inválido"}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	usuarioIDStr := r.URL.Query().Get("usuario")
	usuarioID, err := strconv.Atoi(usuarioIDStr)
	if err != nil || usuarioID <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		resp := map[string]string{"message": "usuario inválido"}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	err = h.svc.QuitarPonente(r.Context(), id, usuarioID)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		resp := map[string]string{"message": err.Error()}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GET /api/sesiones/ponentes?sesion_id={id}
func (h *Handler) ListarPonentesPorQueryHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("sesion_id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		resp := map[string]string{"message": "id inválido"}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	resp, err := h.svc.ListPonentes(r.Context(), id)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		resp := map[string]string{"message": err.Error()}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	data, _ := json.MarshalIndent(resp, "", "  ")
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// GET /api/sesiones/ponibles?sesion_id={id}
func (h *Handler) ListarPonentesAsignablesPorQueryHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("sesion_id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		resp := map[string]string{"message": "id inválido"}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	resp, err := h.svc.ListPonentesAsignables(r.Context(), id)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		resp := map[string]string{"message": err.Error()}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	data, _ := json.MarshalIndent(resp, "", "  ")
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// GET /api/sesiones?sesion_id={id}
func (h *Handler) ObtenerSesionPorQueryHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("sesion_id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		resp := map[string]string{"message": "id inválido"}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	resp, err := h.svc.GetSesionByID(r.Context(), id)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		resp := map[string]string{"message": err.Error()}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	data, _ := json.MarshalIndent(resp, "", "  ")
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// POST /api/sesiones?evento={id}
func (h *Handler) CrearSesionHandler(w http.ResponseWriter, r *http.Request) {
	println("[Handler] Entrando a CrearSesionHandler")
	eventoIDStr := r.URL.Query().Get("evento")
	eventoID, err := strconv.Atoi(eventoIDStr)
	if err != nil || eventoID <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("evento inválido"))
		return
	}
	var req dto.CreateSesionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("json inválido"))
		return
	}
	resp, err := h.svc.CreateSesion(r.Context(), eventoID, req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		resp := map[string]string{"message": err.Error()}
		data, _ := json.MarshalIndent(resp, "", "  ")
		w.Header().Set("Content-Type", "application/json")
		w.Write(data)
		return
	}
	data, _ := json.MarshalIndent(resp, "", "  ")
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// GET /api/sesiones?evento={id}
func (h *Handler) ListarSesionesHandler(w http.ResponseWriter, r *http.Request) {
	eventoIDStr := r.URL.Query().Get("evento")
	eventoID, err := strconv.Atoi(eventoIDStr)
	if err != nil || eventoID <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("evento inválido"))
		return
	}
	resp, err := h.svc.ListSesiones(r.Context(), eventoID)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	data, _ := json.MarshalIndent(resp, "", "  ")
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// GET /api/sesiones/{id}
func (h *Handler) ObtenerSesionHandler(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/sesiones/")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("id inválido"))
		return
	}
	resp, err := h.svc.GetSesionByID(r.Context(), id)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(err.Error()))
		return
	}
	data, _ := json.MarshalIndent(resp, "", "  ")
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// PUT /api/sesiones/{id}
func (h *Handler) ActualizarSesionHandler(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/sesiones/")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("id inválido"))
		return
	}
	var req dto.UpdateSesionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("json inválido"))
		return
	}
	req.IDSesion = id
	resp, err := h.svc.UpdateSesion(r.Context(), id, req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		return
	}
	json.NewEncoder(w).Encode(resp)
}

// DELETE /api/sesiones/{id}
func (h *Handler) EliminarSesionHandler(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/sesiones/")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("id inválido"))
		return
	}
	err = h.svc.DeleteSesion(r.Context(), id)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// POST /api/sesiones/asignar-ponentes/{id}
func (h *Handler) AsignarPonentesHandler(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/sesiones/asignar-ponentes/")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("id inválido"))
		return
	}
	var req dto.AsignarPonentesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("json inválido"))
		return
	}
	err = h.svc.AsignarPonentes(r.Context(), id, req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// POST /api/sesiones/quitar-ponente/{id}?usuario={idUsuario}
func (h *Handler) QuitarPonenteHandler(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/sesiones/quitar-ponente/")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("id inválido"))
		return
	}
	usuarioIDStr := r.URL.Query().Get("usuario")
	usuarioID, err := strconv.Atoi(usuarioIDStr)
	if err != nil || usuarioID <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("usuario inválido"))
		return
	}
	err = h.svc.QuitarPonente(r.Context(), id, usuarioID)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GET /api/sesiones/ponentes/{id}
func (h *Handler) ListarPonentesHandler(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/sesiones/ponentes/")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("id inválido"))
		return
	}
	resp, err := h.svc.ListPonentes(r.Context(), id)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	data, _ := json.MarshalIndent(resp, "", "  ")
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// GET /api/sesiones/ponibles/{id}
func (h *Handler) ListarPonentesAsignablesHandler(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/sesiones/ponibles/")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("id inválido"))
		return
	}
	resp, err := h.svc.ListPonentesAsignables(r.Context(), id)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}
	data, _ := json.MarshalIndent(resp, "", "  ")
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}
