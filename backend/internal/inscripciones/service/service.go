package service

import (
	"context"
	"errors"
	"net/smtp"
	"os"
	"strings"
	"time"

	"project/backend/internal/inscripciones/dto"
	"project/backend/internal/inscripciones/repo"
	"project/backend/internal/inscripciones/validation"
	"project/backend/prisma/db"
)

var (
	ErrEventoNotFound      = errors.New("evento no encontrado")
	ErrEventoCerrado       = errors.New("el evento no está abierto para inscripciones")
	ErrUsuarioNotFound     = errors.New("usuario no encontrado")
	ErrInscripcionExists   = errors.New("ya existe una inscripción para este evento")
	ErrInscripcionNotFound = errors.New("inscripción no encontrada")
	ErrEstadoInvalido      = errors.New("estado de inscripción inválido")
	ErrPreferenciasInvalid = errors.New("preferencias inválidas")
	ErrDB                  = errors.New("db error")
)

type Service struct {
	repo *repo.Repository
}

func New(repository *repo.Repository) *Service {
	return &Service{repo: repository}
}

func (s *Service) CreateInscripcion(ctx context.Context, req dto.CreateInscripcionRequest) (int, error) {
	evento, err := s.repo.FindEventoByID(ctx, req.IDEvento)
	if err != nil {
		if errors.Is(err, db.ErrNotFound) {
			return 0, ErrEventoNotFound
		}
		return 0, ErrDB
	}

	now := time.Now()
	if !evento.InscripcionesAbiertasManual || now.After(evento.FechaCierreInscripcion) {
		return 0, ErrEventoCerrado
	}

	if _, err := s.repo.FindUsuarioByID(ctx, req.IDUsuario); err != nil {
		if errors.Is(err, db.ErrNotFound) {
			return 0, ErrUsuarioNotFound
		}
		return 0, ErrDB
	}

	if _, err := s.repo.FindInscripcionByEventoUsuario(ctx, req.IDEvento, req.IDUsuario); err == nil {
		return 0, ErrInscripcionExists
	} else if err != nil && !errors.Is(err, db.ErrNotFound) {
		return 0, ErrDB
	}

	id, err := s.repo.CreateInscripcion(ctx, req.IDEvento, req.IDUsuario, req.NombreParticipante, req.Email, req.Afiliacion, req.ComprobantePago, "Pendiente")
	if err != nil {
		return 0, ErrDB
	}

	_ = s.repo.InsertHistorial(ctx, id, "", "Pendiente", "Confirmada", "system")
	_ = s.repo.InsertNotificacion(ctx, req.IDUsuario, &id, "Confirmación de inscripción", "Tu inscripción fue registrada correctamente")
	_ = sendConfirmationEmail(req.Email, req.NombreParticipante, evento.Nombre)

	return id, nil
}

func sendConfirmationEmail(to, nombre, evento string) error {
	subject := "Confirmación de inscripción"
	body := "Hola " + nombre + ",\n\nTu inscripción al evento '" + evento + "' fue registrada correctamente.\n\nGracias."
	return sendEmail(to, subject, body)
}

func sendEmail(to, subject, body string) error {
	host := strings.TrimSpace(os.Getenv("SMTP_HOST"))
	if host == "" {
		return nil
	}
	port := strings.TrimSpace(os.Getenv("SMTP_PORT"))
	if port == "" {
		port = "587"
	}
	user := strings.TrimSpace(os.Getenv("SMTP_USER"))
	pass := strings.TrimSpace(os.Getenv("SMTP_PASS"))
	from := strings.TrimSpace(os.Getenv("SMTP_FROM"))
	if from == "" {
		from = user
	}

	msg := "From: " + from + "\r\n" +
		"To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n\r\n" +
		body

	addr := host + ":" + port
	if user == "" {
		return smtp.SendMail(addr, nil, from, []string{to}, []byte(msg))
	}
	auth := smtp.PlainAuth("", user, pass, host)
	return smtp.SendMail(addr, auth, from, []string{to}, []byte(msg))
}

func shouldSendStatusEmail(pref repo.PreferenciaRow) bool {
	if !pref.Habilitado {
		return false
	}
	return strings.Contains(strings.ToLower(pref.Tipos), "estado")
}

func buildStatusEmail(nombre, evento, estado, fecha, nota string) (string, string) {
	asunto := "Actualización de inscripción: " + estado
	msg := "Hola " + nombre + ",\n\nTu estado de inscripción cambió a: " + estado + ".\nEvento: " + evento + "\nFecha: " + fecha + "."
	if strings.TrimSpace(nota) != "" {
		msg += "\nDetalles: " + strings.TrimSpace(nota) + "."
	}
	msg += "\n\nGracias."
	return asunto, msg
}

func (s *Service) ListInscripciones(ctx context.Context, filters map[string]interface{}) ([]repo.InscripcionRow, error) {
	rows, err := s.repo.ListInscripciones(ctx, filters)
	if err != nil {
		return nil, err
	}
	return rows, nil
}

func (s *Service) UpdateEstado(ctx context.Context, req dto.UpdateEstadoRequest) error {
	if !validation.IsAllowedStatus(req.Estado) {
		return ErrEstadoInvalido
	}

	filters := map[string]interface{}{"id_inscripcion": req.IDInscripcion}
	rows, err := s.repo.ListInscripciones(ctx, filters)
	if err != nil {
		return ErrDB
	}
	if len(rows) == 0 {
		return ErrInscripcionNotFound
	}

	actual := rows[0].Estado
	newStatus := validation.NormalizeStatus(req.Estado)
	if err := s.repo.UpdateEstado(ctx, req.IDInscripcion, newStatus); err != nil {
		return ErrDB
	}

	_ = s.repo.InsertHistorial(ctx, req.IDInscripcion, actual, newStatus, req.Nota, req.Actor)

	pref, err := s.repo.GetPreferencias(ctx, rows[0].IDUsuario)
	if err == nil && pref != nil && shouldSendStatusEmail(*pref) {
		fecha := time.Now().Format("02/01/2006")
		asunto, mensaje := buildStatusEmail(rows[0].Nombre, rows[0].EventoNombre, newStatus, fecha, req.Nota)
		_ = s.repo.InsertNotificacion(ctx, rows[0].IDUsuario, &req.IDInscripcion, asunto, mensaje)
		_ = sendEmail(rows[0].Email, asunto, mensaje)
	}

	return nil
}

func (s *Service) Historial(ctx context.Context, inscripcionID int) ([]repo.HistorialRow, error) {
	rows, err := s.repo.ListHistorial(ctx, inscripcionID)
	if err != nil {
		return nil, ErrDB
	}
	return rows, nil
}

func (s *Service) GetPreferencias(ctx context.Context, usuarioID int) (repo.PreferenciaRow, error) {
	pref, err := s.repo.GetPreferencias(ctx, usuarioID)
	if err == nil {
		return *pref, nil
	}
	if errors.Is(err, db.ErrNotFound) {
		created, err := s.repo.UpsertPreferencias(ctx, usuarioID, "inmediata", "estado", true)
		if err != nil {
			return repo.PreferenciaRow{}, ErrDB
		}
		return created, nil
	}
	return repo.PreferenciaRow{}, ErrDB
}

func (s *Service) UpdatePreferencias(ctx context.Context, req dto.PreferenciasRequest) (repo.PreferenciaRow, error) {
	if strings.TrimSpace(req.Frecuencia) == "" || strings.TrimSpace(req.Tipos) == "" {
		return repo.PreferenciaRow{}, ErrPreferenciasInvalid
	}

	habilitado := true
	if req.Habilitado != nil {
		habilitado = *req.Habilitado
	}

	updated, err := s.repo.UpsertPreferencias(ctx, req.IDUsuario, req.Frecuencia, req.Tipos, habilitado)
	if err != nil {
		return repo.PreferenciaRow{}, ErrDB
	}
	return updated, nil
}

func (s *Service) Notificaciones(ctx context.Context, usuarioID int) ([]repo.NotificacionRow, error) {
	rows, err := s.repo.ListNotificaciones(ctx, usuarioID)
	if err != nil {
		return nil, ErrDB
	}
	return rows, nil
}

func (s *Service) Reporte(ctx context.Context, filters map[string]interface{}) (map[string]int, int, error) {
	result, total, err := s.repo.ReportePorEstado(ctx, filters)
	if err != nil {
		return nil, 0, err
	}
	return result, total, nil
}

func (s *Service) CrearReporteProgramado(ctx context.Context, req dto.ReporteProgramadoRequest) (repo.ReporteProgramadoRow, error) {
	if req.Frecuencia == "" || req.Formato == "" {
		return repo.ReporteProgramadoRow{}, ErrPreferenciasInvalid
	}
	created, err := s.repo.CreateReporteProgramado(ctx, req.IDEvento, req.Estado, req.Frecuencia, req.Formato, req.CreadoPor)
	if err != nil {
		return repo.ReporteProgramadoRow{}, ErrDB
	}
	return created, nil
}

func (s *Service) ReportesProgramados(ctx context.Context) ([]repo.ReporteProgramadoRow, error) {
	rows, err := s.repo.ListReportesProgramados(ctx)
	if err != nil {
		return nil, ErrDB
	}
	return rows, nil
}
