package service

import (
	"context"
	"errors"
	"time"

	"project/backend/internal/registrations/dto"
	"project/backend/internal/registrations/repo"
	"project/backend/prisma/db"
)

// Define custom errors for service
var (
	ErrEventoNotFound        = errors.New("Evento no encontrado")
	ErrUsuarioNotFound       = errors.New("Usuario no encontrado")
	ErrInscripcionesCerradas = errors.New("Las inscripciones estan cerradas")
	ErrYaInscrito            = errors.New("El usuario ya esta inscrito en este evento")
	ErrInscripcionNotFound   = errors.New("Inscripcion no encontrada")
	ErrDB                    = errors.New("db error")
)

type Service struct {
	repo *repo.Repository
}

func New(repository *repo.Repository) *Service {
	return &Service{repo: repository}
}

func (s *Service) CreateInscripcion(ctx context.Context, req dto.CreateInscripcionRequest, now time.Time) (*db.InscripcionModel, error) {
	evento, err := s.repo.FindEventoByID(ctx, req.EventoID)

	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			return nil, ErrEventoNotFound
		}
		return nil, ErrDB
	}

	// Check if inscripciones are open
	if !isInscripcionesAbiertas(evento, now) {
		return nil, ErrInscripcionesCerradas
	}

	_, err = s.repo.FindUsuarioByID(ctx, req.UsuarioID)
	// Check if user exists
	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			return nil, ErrUsuarioNotFound
		}
		return nil, ErrDB
	}

	existing, err := s.repo.FindByEventoAndUsuario(ctx, req.EventoID, req.UsuarioID)
	// Check if user is already inscribed
	if err != nil {
		return nil, ErrDB
	}
	if len(existing) > 0 {
		return nil, ErrYaInscrito
	}

	created, err := s.repo.Create(ctx, req.EventoID, req.UsuarioID, req.EstadoPago, req.Comprobante)
	if err != nil {
		return nil, ErrDB
	}
	return created, nil
}

func (s *Service) ListInscripciones(ctx context.Context, eventoID, usuarioID int) ([]db.InscripcionModel, error) {
	if eventoID > 0 && usuarioID > 0 {
		inscripciones, err := s.repo.FindByEventoAndUsuario(ctx, eventoID, usuarioID)
		if err != nil {
			return nil, ErrDB
		}
		return inscripciones, nil
	}
	if eventoID > 0 {
		inscripciones, err := s.repo.FindByEventoID(ctx, eventoID)
		if err != nil {
			return nil, ErrDB
		}
		return inscripciones, nil
	}
	if usuarioID > 0 {
		inscripciones, err := s.repo.FindByUsuarioID(ctx, usuarioID)
		if err != nil {
			return nil, ErrDB
		}
		return inscripciones, nil
	}
	inscripciones, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, ErrDB
	}
	return inscripciones, nil
}

func (s *Service) UpdatePago(ctx context.Context, inscripcionID int, estadoPago bool, comprobante string) (*db.InscripcionModel, error) {
	_, err := s.repo.FindByID(ctx, inscripcionID)
	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			return nil, ErrInscripcionNotFound
		}
		return nil, ErrDB
	}

	updated, err := s.repo.UpdatePago(ctx, inscripcionID, estadoPago, comprobante)
	if err != nil {
		return nil, ErrDB
	}
	return updated, nil
}

func isInscripcionesAbiertas(evento *db.EventoModel, now time.Time) bool {
	if !evento.InscripcionesAbiertasManual {
		return false
	}
	if !now.Before(evento.FechaCierreInscripcion) {
		return false
	}
	if !now.Before(evento.FechaInicio) {
		return false
	}
	return true
}

func (s *Service) GetAllEventos(ctx context.Context) ([]db.EventoModel, error) {
	return s.repo.GetAllEventos(ctx)
}
