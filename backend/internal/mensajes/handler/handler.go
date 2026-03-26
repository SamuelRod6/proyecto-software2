package handler

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	mensajesdto "project/backend/internal/mensajes/dto"
	mensajesrepo "project/backend/internal/mensajes/repo"
	mensajesservice "project/backend/internal/mensajes/service"
	notifRepo "project/backend/internal/notifications/repo"
	"project/backend/internal/shared/httperror"
	"project/backend/prisma/db"
)

type Handler struct {
	svc mensajesservice.MensajesService
}

func New(client *db.PrismaClient) *Handler {
	r := mensajesrepo.New(client)
	nr := notifRepo.NewNotificationRepository(client)
	svc := mensajesservice.New(r, nr)
	return &Handler{svc: svc}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	switch {
	case r.Method == http.MethodPost && r.URL.Path == "/api/mensajes/conversaciones":
		h.createConversacion(w, r)
	case r.Method == http.MethodGet && r.URL.Path == "/api/mensajes/conversaciones":
		h.listConversaciones(w, r)
	case r.Method == http.MethodGet && strings.HasSuffix(r.URL.Path, "/mensajes"):
		h.getMensajes(w, r)
	case r.Method == http.MethodPost && strings.HasSuffix(r.URL.Path, "/mensajes"):
		h.sendMensaje(w, r)
	case r.Method == http.MethodGet && strings.HasSuffix(r.URL.Path, "/participantes"):
		h.getParticipantes(w, r)
	case r.Method == http.MethodPost && strings.HasSuffix(r.URL.Path, "/participantes"):
		h.addParticipante(w, r)
	case r.Method == http.MethodDelete && strings.Contains(r.URL.Path, "/participantes/"):
		h.removeParticipante(w, r)
	default:
		http.Error(w, "not found", http.StatusNotFound)
	}
}

func (h *Handler) SearchUsuariosHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	q := r.URL.Query().Get("q")
	if q == "" {
		httperror.WriteJSON(w, http.StatusBadRequest, "parámetro q requerido")
		return
	}
	usuarios, err := h.svc.SearchUsuarios(r.Context(), q)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(usuarios)
}

func (h *Handler) UploadAdjuntoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "error al parsear formulario")
		return
	}
	file, header, err := r.FormFile("file")
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "campo 'file' requerido")
		return
	}
	defer file.Close()

	// Validate MIME type
	allowedTypes := map[string]bool{
		"image/jpeg":      true,
		"image/png":       true,
		"application/pdf": true,
	}
	contentType := header.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		httperror.WriteJSON(w, http.StatusBadRequest, "tipo de archivo no permitido (jpeg, png, pdf)")
		return
	}

	uploadDir := filepath.Join(".", "uploads", "mensajes")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, "error al crear directorio de uploads")
		return
	}

	ext := filepath.Ext(header.Filename)
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	filename := fmt.Sprintf("%s%s", hex.EncodeToString(b), ext)
	destPath := filepath.Join(uploadDir, filename)

	dest, err := os.Create(destPath)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, "error al guardar archivo")
		return
	}
	defer dest.Close()

	if _, err := io.Copy(dest, file); err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, "error al escribir archivo")
		return
	}

	url := fmt.Sprintf("/uploads/mensajes/%s", filename)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"url":    url,
		"nombre": header.Filename,
	})
}

func (h *Handler) createConversacion(w http.ResponseWriter, r *http.Request) {
	var req mensajesdto.CreateConversacionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "json inválido")
		return
	}
	if len(req.ParticipanteIDs) < 2 {
		httperror.WriteJSON(w, http.StatusBadRequest, "se requieren al menos 2 participantes")
		return
	}
	conv, err := h.svc.CreateConversacion(r.Context(), req)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(conv)
}

func (h *Handler) listConversaciones(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		httperror.WriteJSON(w, http.StatusBadRequest, "parámetro user_id requerido")
		return
	}
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "user_id inválido")
		return
	}
	convs, err := h.svc.ListConversaciones(r.Context(), userID)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(convs)
}

func (h *Handler) getMensajes(w http.ResponseWriter, r *http.Request) {
	// Path: /api/mensajes/conversaciones/{id}/mensajes
	parts := strings.Split(r.URL.Path, "/")
	// parts: ["", "api", "mensajes", "conversaciones", "{id}", "mensajes"]
	if len(parts) < 6 {
		httperror.WriteJSON(w, http.StatusBadRequest, "id de conversación requerido")
		return
	}
	convID, err := strconv.Atoi(parts[4])
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "id de conversación inválido")
		return
	}
	mensajes, err := h.svc.GetMensajes(r.Context(), convID)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(mensajes)
}

func (h *Handler) sendMensaje(w http.ResponseWriter, r *http.Request) {
	var req mensajesdto.SendMensajeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "json inválido")
		return
	}
	if req.Cuerpo == "" {
		httperror.WriteJSON(w, http.StatusBadRequest, "cuerpo del mensaje requerido")
		return
	}
	msg, err := h.svc.SendMensaje(r.Context(), req)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(msg)
}

// getParticipantes: GET /api/mensajes/conversaciones/{id}/participantes
func (h *Handler) getParticipantes(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 6 {
		httperror.WriteJSON(w, http.StatusBadRequest, "id de conversación requerido")
		return
	}
	convID, err := strconv.Atoi(parts[4])
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "id de conversación inválido")
		return
	}
	participantes, err := h.svc.GetParticipantes(r.Context(), convID)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(participantes)
}

// addParticipante: POST /api/mensajes/conversaciones/{id}/participantes
func (h *Handler) addParticipante(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 6 {
		httperror.WriteJSON(w, http.StatusBadRequest, "id de conversación requerido")
		return
	}
	convID, err := strconv.Atoi(parts[4])
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "id de conversación inválido")
		return
	}
	var body struct {
		IDUsuario int `json:"id_usuario"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.IDUsuario == 0 {
		httperror.WriteJSON(w, http.StatusBadRequest, "id_usuario requerido")
		return
	}
	conv, err := h.svc.AddParticipante(r.Context(), convID, body.IDUsuario)
	if err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(conv)
}

// removeParticipante: DELETE /api/mensajes/conversaciones/{id}/participantes/{userId}
func (h *Handler) removeParticipante(w http.ResponseWriter, r *http.Request) {
	// Path: /api/mensajes/conversaciones/{id}/participantes/{userId}
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 7 {
		httperror.WriteJSON(w, http.StatusBadRequest, "id de conversación y usuario requeridos")
		return
	}
	convID, err := strconv.Atoi(parts[4])
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "id de conversación inválido")
		return
	}
	userID, err := strconv.Atoi(parts[6])
	if err != nil {
		httperror.WriteJSON(w, http.StatusBadRequest, "id de usuario inválido")
		return
	}
	if err := h.svc.RemoveParticipante(r.Context(), convID, userID); err != nil {
		httperror.WriteJSON(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
