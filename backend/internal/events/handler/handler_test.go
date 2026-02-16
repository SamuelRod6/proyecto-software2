package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"project/backend/internal/events/dto"
	"project/backend/internal/events/service"
	"project/backend/prisma/db"
)

type mockEventService struct {
	ensureNombreUnico     func(ctx context.Context, nombre string) error
	ensureNoSolapamiento  func(ctx context.Context, start, end time.Time) error
	createEvento          func(ctx context.Context, req dto.CreateEventoRequest, start, end, cierre time.Time) (*db.EventoModel, error)
	listEventos           func(ctx context.Context) ([]db.EventoModel, error)
	updateEvento          func(ctx context.Context, req dto.UpdateEventoRequest, start, end, cierre time.Time) (*db.EventoModel, error)
	cerrarInscripciones   func(ctx context.Context, eventoID int) (*db.EventoModel, error)
	abrirInscripciones    func(ctx context.Context, eventoID int) (*db.EventoModel, error)
}

func (m mockEventService) EnsureNombreUnico(ctx context.Context, nombre string) error {
	if m.ensureNombreUnico == nil {
		return nil
	}
	return m.ensureNombreUnico(ctx, nombre)
}

func (m mockEventService) EnsureNoSolapamiento(ctx context.Context, start, end time.Time) error {
	if m.ensureNoSolapamiento == nil {
		return nil
	}
	return m.ensureNoSolapamiento(ctx, start, end)
}

func (m mockEventService) CreateEvento(ctx context.Context, req dto.CreateEventoRequest, start, end, cierre time.Time) (*db.EventoModel, error) {
	if m.createEvento == nil {
		return nil, errors.New("not implemented")
	}
	return m.createEvento(ctx, req, start, end, cierre)
}

func (m mockEventService) ListEventos(ctx context.Context) ([]db.EventoModel, error) {
	if m.listEventos == nil {
		return nil, errors.New("not implemented")
	}
	return m.listEventos(ctx)
}

func (m mockEventService) UpdateEvento(ctx context.Context, req dto.UpdateEventoRequest, start, end, cierre time.Time) (*db.EventoModel, error) {
	if m.updateEvento == nil {
		return nil, errors.New("not implemented")
	}
	return m.updateEvento(ctx, req, start, end, cierre)
}

func (m mockEventService) CerrarInscripciones(ctx context.Context, eventoID int) (*db.EventoModel, error) {
	if m.cerrarInscripciones == nil {
		return nil, errors.New("not implemented")
	}
	return m.cerrarInscripciones(ctx, eventoID)
}

func (m mockEventService) AbrirInscripciones(ctx context.Context, eventoID int) (*db.EventoModel, error) {
	if m.abrirInscripciones == nil {
		return nil, errors.New("not implemented")
	}
	return m.abrirInscripciones(ctx, eventoID)
}

func TestServeHTTPMethodNotAllowed(t *testing.T) {
	req := httptest.NewRequest(http.MethodDelete, "/api/eventos", nil)
	rr := httptest.NewRecorder()

	h := NewWithService(mockEventService{})
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected %d, got %d", http.StatusMethodNotAllowed, rr.Code)
	}
}

func TestCreateEvento(t *testing.T) {
	t.Run("invalid json", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/eventos", bytes.NewBufferString("{"))
		rr := httptest.NewRecorder()

		h := NewWithService(mockEventService{})
		h.ServeHTTP(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected %d, got %d", http.StatusBadRequest, rr.Code)
		}
	})

	t.Run("success", func(t *testing.T) {
		now := time.Now()
		start := now.Add(48 * time.Hour)
		end := now.Add(72 * time.Hour)
		cierre := now.Add(24 * time.Hour)

		reqBody := dto.CreateEventoRequest{
			Nombre:                 "Evento Prueba",
			FechaInicio:            start.Format("02/01/2006"),
			FechaFin:               end.Format("02/01/2006"),
			FechaCierreInscripcion: cierre.Format("02/01/2006"),
			Ubicacion:              "Caracas, Venezuela",
		}
		payload, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/eventos", bytes.NewBuffer(payload))
		rr := httptest.NewRecorder()

		svc := mockEventService{
			createEvento: func(_ context.Context, req dto.CreateEventoRequest, startDate, endDate, cierreDate time.Time) (*db.EventoModel, error) {
				return &db.EventoModel{InnerEvento: db.InnerEvento{IDEvento: 1, Nombre: req.Nombre, FechaInicio: startDate, FechaFin: endDate, FechaCierreInscripcion: cierreDate, InscripcionesAbiertasManual: true, Ubicacion: req.Ubicacion}}, nil
			},
		}

		h := NewWithService(svc)
		h.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
		}
	})
}

func TestListEventos(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/eventos", nil)
	rr := httptest.NewRecorder()

	svc := mockEventService{
		listEventos: func(_ context.Context) ([]db.EventoModel, error) {
			return []db.EventoModel{}, nil
		},
	}

	h := NewWithService(svc)
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
	}
}

func TestUpdateEvento(t *testing.T) {
	now := time.Now()
	start := now.Add(48 * time.Hour)
	end := now.Add(72 * time.Hour)
	cierre := now.Add(24 * time.Hour)

	reqBody := dto.UpdateEventoRequest{
		ID:                     1,
		Nombre:                 "Evento Actualizado",
		FechaInicio:            start.Format("02/01/2006"),
		FechaFin:               end.Format("02/01/2006"),
		FechaCierreInscripcion: cierre.Format("02/01/2006"),
		Ubicacion:              "Caracas, Venezuela",
	}
	payload, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPut, "/api/eventos", bytes.NewBuffer(payload))
	rr := httptest.NewRecorder()

	svc := mockEventService{
		updateEvento: func(_ context.Context, req dto.UpdateEventoRequest, startDate, endDate, cierreDate time.Time) (*db.EventoModel, error) {
			return &db.EventoModel{InnerEvento: db.InnerEvento{IDEvento: req.ID, Nombre: req.Nombre, FechaInicio: startDate, FechaFin: endDate, FechaCierreInscripcion: cierreDate, InscripcionesAbiertasManual: true, Ubicacion: req.Ubicacion}}, nil
		},
	}

	h := NewWithService(svc)
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
	}
}

func TestPatchEvento(t *testing.T) {
	t.Run("invalid action", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPatch, "/api/eventos?action=unknown&id=1", nil)
		rr := httptest.NewRecorder()

		h := NewWithService(mockEventService{})
		h.ServeHTTP(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected %d, got %d", http.StatusBadRequest, rr.Code)
		}
	})

	t.Run("invalid id", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPatch, "/api/eventos?action=cerrar&id=abc", nil)
		rr := httptest.NewRecorder()

		h := NewWithService(mockEventService{})
		h.ServeHTTP(rr, req)

		if rr.Code != http.StatusBadRequest {
			t.Fatalf("expected %d, got %d", http.StatusBadRequest, rr.Code)
		}
	})

	t.Run("cerrar success", func(t *testing.T) {
		id := 2
		req := httptest.NewRequest(http.MethodPatch, "/api/eventos?action=cerrar&id="+strconv.Itoa(id), nil)
		rr := httptest.NewRecorder()

		svc := mockEventService{
			cerrarInscripciones: func(_ context.Context, eventoID int) (*db.EventoModel, error) {
				return &db.EventoModel{InnerEvento: db.InnerEvento{IDEvento: eventoID, Nombre: "Evento", FechaInicio: time.Now().Add(24 * time.Hour), FechaFin: time.Now().Add(48 * time.Hour), FechaCierreInscripcion: time.Now().Add(12 * time.Hour), InscripcionesAbiertasManual: false, Ubicacion: "Caracas, Venezuela"}}, nil
			},
		}

		h := NewWithService(svc)
		h.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
		}
	})

	t.Run("abrir success", func(t *testing.T) {
		id := 3
		req := httptest.NewRequest(http.MethodPatch, "/api/eventos?action=abrir&id="+strconv.Itoa(id), nil)
		rr := httptest.NewRecorder()

		svc := mockEventService{
			abrirInscripciones: func(_ context.Context, eventoID int) (*db.EventoModel, error) {
				return &db.EventoModel{InnerEvento: db.InnerEvento{IDEvento: eventoID, Nombre: "Evento", FechaInicio: time.Now().Add(24 * time.Hour), FechaFin: time.Now().Add(48 * time.Hour), FechaCierreInscripcion: time.Now().Add(12 * time.Hour), InscripcionesAbiertasManual: true, Ubicacion: "Caracas, Venezuela"}}, nil
			},
		}

		h := NewWithService(svc)
		h.ServeHTTP(rr, req)

		if rr.Code != http.StatusOK {
			t.Fatalf("expected %d, got %d", http.StatusOK, rr.Code)
		}
	})
}

func TestCreateEventoNameConflict(t *testing.T) {
	now := time.Now()
	start := now.Add(48 * time.Hour)
	end := now.Add(72 * time.Hour)
	cierre := now.Add(24 * time.Hour)

	reqBody := dto.CreateEventoRequest{
		Nombre:                 "Evento Prueba",
		FechaInicio:            start.Format("02/01/2006"),
		FechaFin:               end.Format("02/01/2006"),
		FechaCierreInscripcion: cierre.Format("02/01/2006"),
		Ubicacion:              "Caracas, Venezuela",
	}
	payload, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/api/eventos", bytes.NewBuffer(payload))
	rr := httptest.NewRecorder()

	svc := mockEventService{
		ensureNombreUnico: func(_ context.Context, _ string) error {
			return service.ErrNameExists
		},
	}

	h := NewWithService(svc)
	h.ServeHTTP(rr, req)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected %d, got %d", http.StatusConflict, rr.Code)
	}
}
