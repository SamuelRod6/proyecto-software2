package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	mensajesdto "project/backend/internal/mensajes/dto"
)

// mockMensajesService implementa MensajesService para tests
type mockMensajesService struct {
	conv      *mensajesdto.ConversacionResponse
	convErr   error
	convs     []mensajesdto.ConversacionResponse
	convsErr  error
	msg       *mensajesdto.MensajeResponse
	msgErr    error
	msgs      []mensajesdto.MensajeResponse
	msgsErr   error
	usuarios  []mensajesdto.ParticipanteResponse
	usuErr    error
}

func (m *mockMensajesService) CreateConversacion(_ context.Context, _ mensajesdto.CreateConversacionRequest) (*mensajesdto.ConversacionResponse, error) {
	return m.conv, m.convErr
}
func (m *mockMensajesService) ListConversaciones(_ context.Context, _ int) ([]mensajesdto.ConversacionResponse, error) {
	return m.convs, m.convsErr
}
func (m *mockMensajesService) SendMensaje(_ context.Context, _ mensajesdto.SendMensajeRequest) (*mensajesdto.MensajeResponse, error) {
	return m.msg, m.msgErr
}
func (m *mockMensajesService) GetMensajes(_ context.Context, _ int) ([]mensajesdto.MensajeResponse, error) {
	return m.msgs, m.msgsErr
}
func (m *mockMensajesService) SearchUsuarios(_ context.Context, _ string) ([]mensajesdto.ParticipanteResponse, error) {
	return m.usuarios, m.usuErr
}
func (m *mockMensajesService) AddParticipante(_ context.Context, _, _ int) (*mensajesdto.ConversacionResponse, error) {
	return m.conv, m.convErr
}
func (m *mockMensajesService) RemoveParticipante(_ context.Context, _, _ int) error {
	return m.convErr
}
func (m *mockMensajesService) GetParticipantes(_ context.Context, _ int) ([]mensajesdto.ParticipanteResponse, error) {
	return m.usuarios, m.usuErr
}

func newTestHandler(svc *mockMensajesService) *Handler {
	return &Handler{svc: svc}
}

// --- POST /api/mensajes/conversaciones ---

func TestCreateConversacion(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		svc := &mockMensajesService{
			conv: &mensajesdto.ConversacionResponse{IDConversacion: 1, Asunto: "Hola"},
		}
		body := `{"asunto":"Hola","participante_ids":[1,2]}`
		req := httptest.NewRequest(http.MethodPost, "/api/mensajes/conversaciones", strings.NewReader(body))
		rr := httptest.NewRecorder()
		newTestHandler(svc).ServeHTTP(rr, req)
		if rr.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d", rr.Code)
		}
		var resp mensajesdto.ConversacionResponse
		if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
			t.Fatalf("decode error: %v", err)
		}
		if resp.IDConversacion != 1 {
			t.Fatalf("expected id 1, got %d", resp.IDConversacion)
		}
	})

	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/mensajes/conversaciones", strings.NewReader("{bad"))
		rr := httptest.NewRecorder()
		newTestHandler(&mockMensajesService{}).ServeHTTP(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("less than 2 participants", func(t *testing.T) {
		body := `{"asunto":"X","participante_ids":[1]}`
		req := httptest.NewRequest(http.MethodPost, "/api/mensajes/conversaciones", strings.NewReader(body))
		rr := httptest.NewRecorder()
		newTestHandler(&mockMensajesService{}).ServeHTTP(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("service error", func(t *testing.T) {
		svc := &mockMensajesService{convErr: errors.New("db error")}
		body := `{"asunto":"X","participante_ids":[1,2]}`
		req := httptest.NewRequest(http.MethodPost, "/api/mensajes/conversaciones", strings.NewReader(body))
		rr := httptest.NewRecorder()
		newTestHandler(svc).ServeHTTP(rr, req)
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})
}

// --- GET /api/mensajes/conversaciones ---

func TestListConversaciones(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		svc := &mockMensajesService{
			convs: []mensajesdto.ConversacionResponse{
				{IDConversacion: 1, Asunto: "Test"},
			},
		}
		req := httptest.NewRequest(http.MethodGet, "/api/mensajes/conversaciones?user_id=1", nil)
		rr := httptest.NewRecorder()
		newTestHandler(svc).ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rr.Code)
		}
	})

	t.Run("missing user_id", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/mensajes/conversaciones", nil)
		rr := httptest.NewRecorder()
		newTestHandler(&mockMensajesService{}).ServeHTTP(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("invalid user_id", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/mensajes/conversaciones?user_id=abc", nil)
		rr := httptest.NewRecorder()
		newTestHandler(&mockMensajesService{}).ServeHTTP(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("service error", func(t *testing.T) {
		svc := &mockMensajesService{convsErr: errors.New("db error")}
		req := httptest.NewRequest(http.MethodGet, "/api/mensajes/conversaciones?user_id=1", nil)
		rr := httptest.NewRecorder()
		newTestHandler(svc).ServeHTTP(rr, req)
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})
}

// --- GET /api/mensajes/conversaciones/{id}/mensajes ---

func TestGetMensajes(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		svc := &mockMensajesService{
			msgs: []mensajesdto.MensajeResponse{{IDMensaje: 1, Cuerpo: "Hola"}},
		}
		req := httptest.NewRequest(http.MethodGet, "/api/mensajes/conversaciones/1/mensajes", nil)
		rr := httptest.NewRecorder()
		newTestHandler(svc).ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rr.Code)
		}
	})

	t.Run("invalid conv id", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/mensajes/conversaciones/abc/mensajes", nil)
		rr := httptest.NewRecorder()
		newTestHandler(&mockMensajesService{}).ServeHTTP(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("service error", func(t *testing.T) {
		svc := &mockMensajesService{msgsErr: errors.New("db error")}
		req := httptest.NewRequest(http.MethodGet, "/api/mensajes/conversaciones/1/mensajes", nil)
		rr := httptest.NewRecorder()
		newTestHandler(svc).ServeHTTP(rr, req)
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})
}

// --- POST /api/mensajes/conversaciones/{id}/mensajes ---

func TestSendMensaje(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		svc := &mockMensajesService{
			msg: &mensajesdto.MensajeResponse{IDMensaje: 1, Cuerpo: "Hola"},
		}
		body := `{"id_conversacion":1,"id_remitente":2,"cuerpo":"Hola"}`
		req := httptest.NewRequest(http.MethodPost, "/api/mensajes/conversaciones/1/mensajes", strings.NewReader(body))
		rr := httptest.NewRecorder()
		newTestHandler(svc).ServeHTTP(rr, req)
		if rr.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d", rr.Code)
		}
	})

	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/mensajes/conversaciones/1/mensajes", strings.NewReader("{bad"))
		rr := httptest.NewRecorder()
		newTestHandler(&mockMensajesService{}).ServeHTTP(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("empty cuerpo", func(t *testing.T) {
		body := `{"id_conversacion":1,"id_remitente":2,"cuerpo":""}`
		req := httptest.NewRequest(http.MethodPost, "/api/mensajes/conversaciones/1/mensajes", strings.NewReader(body))
		rr := httptest.NewRecorder()
		newTestHandler(&mockMensajesService{}).ServeHTTP(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("service error", func(t *testing.T) {
		svc := &mockMensajesService{msgErr: errors.New("db error")}
		body := `{"id_conversacion":1,"id_remitente":2,"cuerpo":"Hola"}`
		req := httptest.NewRequest(http.MethodPost, "/api/mensajes/conversaciones/1/mensajes", strings.NewReader(body))
		rr := httptest.NewRecorder()
		newTestHandler(svc).ServeHTTP(rr, req)
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})
}

// --- GET /api/mensajes/usuarios/buscar ---

func TestSearchUsuariosHandler(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		svc := &mockMensajesService{
			usuarios: []mensajesdto.ParticipanteResponse{
				{IDUsuario: 1, Nombre: "Alice", Email: "alice@test.com"},
			},
		}
		req := httptest.NewRequest(http.MethodGet, "/api/mensajes/usuarios/buscar?q=alice", nil)
		rr := httptest.NewRecorder()
		newTestHandler(svc).SearchUsuariosHandler(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rr.Code)
		}
	})

	t.Run("missing q param", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/mensajes/usuarios/buscar", nil)
		rr := httptest.NewRecorder()
		newTestHandler(&mockMensajesService{}).SearchUsuariosHandler(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("method not allowed", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/mensajes/usuarios/buscar?q=x", nil)
		rr := httptest.NewRecorder()
		newTestHandler(&mockMensajesService{}).SearchUsuariosHandler(rr, req)
		if rr.Code != http.StatusMethodNotAllowed {
			t.Fatalf("expected 405, got %d", rr.Code)
		}
	})

	t.Run("service error", func(t *testing.T) {
		svc := &mockMensajesService{usuErr: errors.New("db error")}
		req := httptest.NewRequest(http.MethodGet, "/api/mensajes/usuarios/buscar?q=alice", nil)
		rr := httptest.NewRecorder()
		newTestHandler(svc).SearchUsuariosHandler(rr, req)
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})
}

// --- GET /api/mensajes/conversaciones/{id}/participantes ---

func TestGetParticipantes(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		svc := &mockMensajesService{
			usuarios: []mensajesdto.ParticipanteResponse{
				{IDUsuario: 1, Nombre: "Alice", Email: "alice@test.com"},
			},
		}
		req := httptest.NewRequest(http.MethodGet, "/api/mensajes/conversaciones/1/participantes", nil)
		rr := httptest.NewRecorder()
		newTestHandler(svc).ServeHTTP(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d", rr.Code)
		}
	})

	t.Run("invalid conv id", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/mensajes/conversaciones/abc/participantes", nil)
		rr := httptest.NewRecorder()
		newTestHandler(&mockMensajesService{}).ServeHTTP(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("service error", func(t *testing.T) {
		svc := &mockMensajesService{usuErr: errors.New("db error")}
		req := httptest.NewRequest(http.MethodGet, "/api/mensajes/conversaciones/1/participantes", nil)
		rr := httptest.NewRecorder()
		newTestHandler(svc).ServeHTTP(rr, req)
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})
}

// --- POST /api/mensajes/conversaciones/{id}/participantes ---

func TestAddParticipante(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		svc := &mockMensajesService{
			conv: &mensajesdto.ConversacionResponse{IDConversacion: 1, Asunto: "Grupo"},
		}
		body := `{"id_usuario":3}`
		req := httptest.NewRequest(http.MethodPost, "/api/mensajes/conversaciones/1/participantes", strings.NewReader(body))
		rr := httptest.NewRecorder()
		newTestHandler(svc).ServeHTTP(rr, req)
		if rr.Code != http.StatusCreated {
			t.Fatalf("expected 201, got %d", rr.Code)
		}
	})

	t.Run("missing id_usuario", func(t *testing.T) {
		body := `{"id_usuario":0}`
		req := httptest.NewRequest(http.MethodPost, "/api/mensajes/conversaciones/1/participantes", strings.NewReader(body))
		rr := httptest.NewRecorder()
		newTestHandler(&mockMensajesService{}).ServeHTTP(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("invalid conv id", func(t *testing.T) {
		body := `{"id_usuario":3}`
		req := httptest.NewRequest(http.MethodPost, "/api/mensajes/conversaciones/abc/participantes", strings.NewReader(body))
		rr := httptest.NewRecorder()
		newTestHandler(&mockMensajesService{}).ServeHTTP(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("service error", func(t *testing.T) {
		svc := &mockMensajesService{convErr: errors.New("db error")}
		body := `{"id_usuario":3}`
		req := httptest.NewRequest(http.MethodPost, "/api/mensajes/conversaciones/1/participantes", strings.NewReader(body))
		rr := httptest.NewRecorder()
		newTestHandler(svc).ServeHTTP(rr, req)
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})
}

// --- DELETE /api/mensajes/conversaciones/{id}/participantes/{userId} ---

func TestRemoveParticipante(t *testing.T) {
	t.Run("success", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/mensajes/conversaciones/1/participantes/3", nil)
		rr := httptest.NewRecorder()
		newTestHandler(&mockMensajesService{}).ServeHTTP(rr, req)
		if rr.Code != http.StatusNoContent {
			t.Fatalf("expected 204, got %d", rr.Code)
		}
	})

	t.Run("invalid conv id", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/mensajes/conversaciones/abc/participantes/3", nil)
		rr := httptest.NewRecorder()
		newTestHandler(&mockMensajesService{}).ServeHTTP(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("invalid user id", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/mensajes/conversaciones/1/participantes/abc", nil)
		rr := httptest.NewRecorder()
		newTestHandler(&mockMensajesService{}).ServeHTTP(rr, req)
		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rr.Code)
		}
	})

	t.Run("service error", func(t *testing.T) {
		svc := &mockMensajesService{convErr: errors.New("db error")}
		req := httptest.NewRequest(http.MethodDelete, "/api/mensajes/conversaciones/1/participantes/3", nil)
		rr := httptest.NewRecorder()
		newTestHandler(svc).ServeHTTP(rr, req)
		if rr.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rr.Code)
		}
	})
}

// --- ServeHTTP default ---

func TestServeHTTP_NotFound(t *testing.T) {
	req := httptest.NewRequest(http.MethodPatch, "/api/mensajes/conversaciones", nil)
	rr := httptest.NewRecorder()
	newTestHandler(&mockMensajesService{}).ServeHTTP(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}
}
