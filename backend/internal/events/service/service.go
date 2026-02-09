package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"project/backend/internal/events/dto"
	"project/backend/internal/events/repo"
	"project/backend/prisma/db"
)

var (
	ErrNameExists            = errors.New("el nombre del evento ya existe")
	ErrOverlap               = errors.New("las fechas se superponen con otro evento")
	ErrDB                    = errors.New("db error")
	ErrNotFound              = errors.New("Evento no encontrado")
	ErrCannotCloseAfterStart = errors.New("No se pueden cerrar inscripciones después de que el evento haya iniciado")
	ErrCannotOpenAfterStart  = errors.New("No se pueden reabrir inscripciones después de que el evento haya iniciado")
)

type Service struct {
	repo *repo.Repository
}

func New(repository *repo.Repository) *Service {
	return &Service{repo: repository}
}

func (s *Service) EnsureNombreUnico(ctx context.Context, nombre string) error {
	existing, err := s.repo.FindByName(ctx, strings.TrimSpace(nombre))
	if err == nil && existing != nil {
		return ErrNameExists
	}
	if err != nil && !errors.Is(err, db.ErrNotFound) {
		return ErrDB
	}
	return nil
}

func (s *Service) EnsureNoSolapamiento(ctx context.Context, start, end time.Time) error {
	eventos, err := s.repo.FindAll(ctx)
	if err != nil {
		return ErrDB
	}
	for _, ev := range eventos {
		if !start.After(ev.FechaFin) && !end.Before(ev.FechaInicio) {
			return ErrOverlap
		}
	}
	return nil
}

func (s *Service) CreateEvento(ctx context.Context, req dto.CreateEventoRequest, start, end, cierre time.Time) (*db.EventoModel, error) {
	created, err := s.repo.Create(ctx, req.Nombre, req.Ubicacion, start, end, cierre)
	if err != nil {
		return nil, ErrDB
	}
	return created, nil
}

func (s *Service) ListEventos(ctx context.Context) ([]db.EventoModel, error) {
	eventos, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, ErrDB
	}
	return eventos, nil
}

func (s *Service) UpdateEvento(ctx context.Context, req dto.UpdateEventoRequest, start, end, cierre time.Time) (*db.EventoModel, error) {
	_, err := s.repo.FindByID(ctx, req.ID)
	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, ErrDB
	}

	existingName, err := s.repo.FindByName(ctx, strings.TrimSpace(req.Nombre))
	if err == nil && existingName != nil && existingName.IDEvento != req.ID {
		return nil, ErrNameExists
	}

	eventos, err := s.repo.FindAll(ctx)
	if err != nil {
		return nil, ErrDB
	}
	for _, ev := range eventos {
		if ev.IDEvento == req.ID {
			continue
		}
		if !start.After(ev.FechaFin) && !end.Before(ev.FechaInicio) {
			return nil, ErrOverlap
		}
	}

	updated, err := s.repo.Update(ctx, req.ID, req.Nombre, req.Ubicacion, start, end, cierre)
	if err != nil {
		return nil, ErrDB
	}
	return updated, nil
}

func (s *Service) CerrarInscripciones(ctx context.Context, eventoID int) (*db.EventoModel, error) {
	evento, err := s.repo.FindByID(ctx, eventoID)
	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, ErrDB
	}

	if time.Now().After(evento.FechaInicio) {
		return nil, ErrCannotCloseAfterStart
	}

	updated, err := s.repo.SetInscripciones(ctx, eventoID, false)
	if err != nil {
		return nil, ErrDB
	}
	return updated, nil
}

func (s *Service) AbrirInscripciones(ctx context.Context, eventoID int) (*db.EventoModel, error) {
	evento, err := s.repo.FindByID(ctx, eventoID)
	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			return nil, ErrNotFound
		}
		return nil, ErrDB
	}

	if time.Now().After(evento.FechaInicio) {
		return nil, ErrCannotOpenAfterStart
	}

	updated, err := s.repo.SetInscripciones(ctx, eventoID, true)
	if err != nil {
		return nil, ErrDB
	}
	return updated, nil
}
