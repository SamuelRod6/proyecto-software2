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

func shouldSendStatusEmail(pref repo.PreferenciaRow, estadoAnterior, estadoNuevo string) bool {
	if !pref.Habilitado {
		return false
	}
	typeSet := parsePreferenceTypes(pref.Tipos)
	if len(typeSet) == 0 {
		return false
	}
	if _, ok := typeSet["estado"]; ok {
		return true
	}
	if _, ok := typeSet["todos"]; ok {
		return true
	}

	transitionType := statusTransitionType(estadoAnterior, estadoNuevo)
	_, ok := typeSet[transitionType]
	return ok
}

func parsePreferenceTypes(tipos string) map[string]struct{} {
	result := make(map[string]struct{})
	tokens := strings.FieldsFunc(strings.ToLower(tipos), func(r rune) bool {
		return r == ',' || r == ';' || r == '|' || r == ' '
	})
	for _, token := range tokens {
		normalized := normalizeStatusTemplateKey(token)
		if normalized == "" {
			continue
		}
		result[normalized] = struct{}{}
	}
	return result
}

func normalizeStatusTemplateKey(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	replacer := strings.NewReplacer(
		"á", "a",
		"é", "e",
		"í", "i",
		"ó", "o",
		"ú", "u",
	)
	return replacer.Replace(normalized)
}

func statusTransitionTemplate(estadoAnterior, estadoNuevo string) (string, string) {
	transition := normalizeStatusTemplateKey(estadoAnterior) + "->" + normalizeStatusTemplateKey(estadoNuevo)

	switch transition {
	case "en revision->aceptado", "en revision->aprobado":
		return "Tu trabajo fue aceptado", "Buenas noticias: tu trabajo científico fue aceptado para continuar con el proceso del evento."
	case "en revision->rechazado":
		return "Resultado de revisión", "La revisión del trabajo científico finalizó y el resultado fue rechazado."
	case "pendiente->pagado":
		return "Pago validado", "Recibimos y validamos el pago de tu inscripción."
	case "pagado->aprobado":
		return "Inscripción aprobada", "Tu inscripción fue aprobada luego de validar los requisitos administrativos."
	case "pagado->rechazado":
		return "Inscripción rechazada", "Tu inscripción fue rechazada luego de la validación administrativa."
	default:
		return "Actualización de estado", "Se registró un cambio en el estado de tu inscripción."
	}
}

func statusTransitionType(estadoAnterior, estadoNuevo string) string {
	transition := normalizeStatusTemplateKey(estadoAnterior) + "->" + normalizeStatusTemplateKey(estadoNuevo)

	switch transition {
	case "en revision->aceptado", "en revision->aprobado":
		return "aceptado"
	case "en revision->rechazado":
		return "rechazado"
	case "pendiente->pagado":
		return "pagado"
	case "pagado->aprobado":
		return "aprobado"
	case "pagado->rechazado":
		return "rechazado"
	default:
		return "estado"
	}
}

func buildStatusEmail(nombre, evento, estadoAnterior, estadoNuevo, fecha, nota string) (string, string) {
	subjectPrefix, intro := statusTransitionTemplate(estadoAnterior, estadoNuevo)
	asunto := subjectPrefix + ": " + estadoNuevo
	msg := "Hola " + nombre + ",\n\n" + intro + "\nEvento: " + evento + "\nEstado anterior: " + estadoAnterior + "\nNuevo estado: " + estadoNuevo + "\nFecha de actualización: " + fecha + "."
	if strings.TrimSpace(nota) != "" {
		msg += "\nInstrucciones adicionales: " + strings.TrimSpace(nota) + "."
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
	if actual == newStatus {
		return nil
	}

	if err := s.repo.UpdateEstado(ctx, req.IDInscripcion, newStatus); err != nil {
		return ErrDB
	}

	_ = s.repo.InsertHistorial(ctx, req.IDInscripcion, actual, newStatus, req.Nota, req.Actor)

	pref, err := s.repo.GetPreferencias(ctx, rows[0].IDUsuario)
	if err == nil && pref != nil && shouldSendStatusEmail(*pref, actual, newStatus) {
		fecha := time.Now().Format("02/01/2006")
		asunto, mensaje := buildStatusEmail(rows[0].Nombre, rows[0].EventoNombre, actual, newStatus, fecha, req.Nota)
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
