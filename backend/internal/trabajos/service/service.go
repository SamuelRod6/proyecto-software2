package service

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	notificationdto "project/backend/internal/notifications/dto"
	notificationsrepo "project/backend/internal/notifications/repo"
	notificationsrv "project/backend/internal/notifications/service"
	"project/backend/internal/trabajos/dto"
	"project/backend/internal/trabajos/repo"
	"project/backend/internal/trabajos/validation"
	"project/backend/prisma/db"
)

type Service struct {
	repo                *repo.Repository
	notificationService notificationsrv.NotificationService
}

var (
	ErrTrabajoDuplicado = errors.New("Ya existe un trabajo con ese título dentro del evento")
	ErrEventoNoValido   = errors.New("El evento no existe")
	ErrTrabajoNoExiste  = errors.New("El trabajo científico no existe")
	ErrSinAcceso        = errors.New("No tiene acceso a este trabajo científico")
)

var venezuelaLocation = time.FixedZone("VET", -4*60*60)

func New(client *db.PrismaClient) *Service {
	workRepo := repo.New(client)
	notificationRepo := notificationsrepo.NewNotificationRepository(client)
	notificationService := notificationsrv.NewNotificationService(notificationRepo)

	return &Service{
		repo:                workRepo,
		notificationService: notificationService,
	}
}

func formatDateTimeVE(t time.Time) string {
	return t.UTC().In(venezuelaLocation).Format("02/01/2006 15:04")
}

func nullableDescripcion(value db.TrabajoCientificoVersionModel) string {
	if v, ok := value.DescripcionCambios(); ok {
		return v
	}
	return ""
}

func (s *Service) CreateTrabajo(ctx context.Context, req dto.CreateTrabajoRequest, file dto.UploadedFile) (*dto.TrabajoResponse, error) {
	if err := validation.ValidateTitulo(req.Titulo); err != nil {
		return nil, err
	}
	if err := validation.ValidateResumen(req.Resumen, req.DeclaraNoConfidencial); err != nil {
		return nil, err
	}
	if err := validation.ValidatePDFContent(file.ContentType, file.Size); err != nil {
		return nil, err
	}

	evento, err := s.repo.FindEventoByID(ctx, req.IDEvento)
	if err != nil || evento == nil {
		return nil, ErrEventoNoValido
	}

	normalized := validation.NormalizeTitle(req.Titulo)
	exists, err := s.repo.ExistsNormalizedTitleInEvent(ctx, req.IDEvento, normalized)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrTrabajoDuplicado
	}

	trabajo, err := s.repo.CreateTrabajo(ctx, req.IDEvento, req.IDUsuario, req.Titulo, normalized, req.Resumen)
	if err != nil {
		return nil, err
	}

	storedPath, err := savePDF(trabajo.IDTrabajo, req.IDEvento, req.IDUsuario, 1, file)
	if err != nil {
		return nil, err
	}

	version, err := s.repo.CreateVersion(
		ctx,
		trabajo.IDTrabajo,
		1,
		file.FileName,
		storedPath,
		int(file.Size),
		file.ContentType,
		req.DescripcionCambios,
	)
	if err != nil {
		return nil, err
	}

	if err := s.repo.UpdateTrabajoVersionActual(ctx, trabajo.IDTrabajo, 1); err != nil {
		return nil, err
	}

	_, _ = s.notificationService.CreateNotification(ctx, notificationdto.CreateNotificationRequest{
		UserID:  req.IDUsuario,
		EventID: &req.IDEvento,
		Type:    notificationdto.NotificationTypeTrabajoRecibido,
		Message: fmt.Sprintf(notificationdto.MsgTrabajoRecibido, trabajo.Titulo),
	})

	committeeUsers, _ := s.repo.FindCommitteeUsers(ctx)
	for _, user := range committeeUsers {
		_, _ = s.notificationService.CreateNotification(ctx, notificationdto.CreateNotificationRequest{
			UserID:  user.IDUsuario,
			EventID: &req.IDEvento,
			Type:    notificationdto.NotificationTypeTrabajoNuevo,
			Message: fmt.Sprintf(notificationdto.MsgTrabajoNuevo, trabajo.Titulo),
		})
	}

	return &dto.TrabajoResponse{
		IDTrabajo:        trabajo.IDTrabajo,
		IDEvento:         trabajo.IDEvento,
		IDUsuario:        trabajo.IDUsuario,
		Titulo:           trabajo.Titulo,
		Resumen:          trabajo.Resumen,
		VersionActual:    trabajo.VersionActual,
		Estado:           trabajo.Estado,
		FechaUltimoEnvio: formatDateTimeVE(version.FechaEnvio),
		ArchivoActual: &dto.VersionResponse{
			IDVersion:          version.IDVersion,
			IDTrabajo:          version.IDTrabajo,
			NumeroVersion:      version.NumeroVersion,
			NombreArchivo:      version.NombreArchivo,
			TamanoBytes:        version.TamanoBytes,
			MimeType:           version.MimeType,
			DescripcionCambios: nullableDescripcion(*version),
			EsActual:           version.EsActual,
			FechaEnvio:         formatDateTimeVE(version.FechaEnvio),
		},
	}, nil
}

func (s *Service) ListTrabajosByUser(ctx context.Context, userID int) ([]dto.TrabajoResponse, error) {
	rows, err := s.repo.ListTrabajosByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	out := make([]dto.TrabajoResponse, 0, len(rows))
	for _, row := range rows {
		current, _ := s.repo.FindCurrentVersion(ctx, row.IDTrabajo)
		item := dto.TrabajoResponse{
			IDTrabajo:     row.IDTrabajo,
			IDEvento:      row.IDEvento,
			IDUsuario:     row.IDUsuario,
			Titulo:        row.Titulo,
			Resumen:       row.Resumen,
			VersionActual: row.VersionActual,
			Estado:        row.Estado,
		}
		if current != nil {
			item.FechaUltimoEnvio = formatDateTimeVE(current.FechaEnvio)
			item.ArchivoActual = &dto.VersionResponse{
				IDVersion:          current.IDVersion,
				IDTrabajo:          current.IDTrabajo,
				NumeroVersion:      current.NumeroVersion,
				NombreArchivo:      current.NombreArchivo,
				TamanoBytes:        current.TamanoBytes,
				MimeType:           current.MimeType,
				DescripcionCambios: nullableDescripcion(*current),
				EsActual:           current.EsActual,
				FechaEnvio:         formatDateTimeVE(current.FechaEnvio),
			}
		}
		out = append(out, item)
	}
	return out, nil
}

func (s *Service) AddVersion(ctx context.Context, req dto.AddVersionRequest, file dto.UploadedFile) (*dto.VersionResponse, error) {
	if err := validation.ValidateDescripcionCambios(req.DescripcionCambios); err != nil {
		return nil, err
	}
	if err := validation.ValidatePDFContent(file.ContentType, file.Size); err != nil {
		return nil, err
	}

	trabajo, err := s.repo.FindTrabajoByIDAndUser(ctx, req.IDTrabajo, req.IDUsuario)
	if err != nil || trabajo == nil {
		return nil, ErrSinAcceso
	}

	evento, err := s.repo.FindEventoByID(ctx, trabajo.IDEvento)
	if err != nil || evento == nil {
		return nil, ErrEventoNoValido
	}

	nextVersion := trabajo.VersionActual + 1
	if err := s.repo.MarkVersionsAsNotCurrent(ctx, trabajo.IDTrabajo); err != nil {
		return nil, err
	}

	storedPath, err := savePDF(trabajo.IDTrabajo, trabajo.IDEvento, trabajo.IDUsuario, nextVersion, file)
	if err != nil {
		return nil, err
	}

	version, err := s.repo.CreateVersion(
		ctx,
		trabajo.IDTrabajo,
		nextVersion,
		file.FileName,
		storedPath,
		int(file.Size),
		file.ContentType,
		req.DescripcionCambios,
	)
	if err != nil {
		return nil, err
	}

	if err := s.repo.UpdateTrabajoVersionActual(ctx, trabajo.IDTrabajo, nextVersion); err != nil {
		return nil, err
	}

	committeeUsers, _ := s.repo.FindCommitteeUsers(ctx)
	for _, user := range committeeUsers {
		_, _ = s.notificationService.CreateNotification(ctx, notificationdto.CreateNotificationRequest{
			UserID:  user.IDUsuario,
			EventID: &trabajo.IDEvento,
			Type:    notificationdto.NotificationTypeTrabajoActualizado,
			Message: fmt.Sprintf(notificationdto.MsgTrabajoActualizado, trabajo.Titulo, nextVersion),
		})
	}

	return &dto.VersionResponse{
		IDVersion:          version.IDVersion,
		IDTrabajo:          version.IDTrabajo,
		NumeroVersion:      version.NumeroVersion,
		NombreArchivo:      version.NombreArchivo,
		TamanoBytes:        version.TamanoBytes,
		MimeType:           version.MimeType,
		DescripcionCambios: nullableDescripcion(*version),
		EsActual:           version.EsActual,
		FechaEnvio:         formatDateTimeVE(version.FechaEnvio),
	}, nil
}

func (s *Service) ListVersiones(ctx context.Context, trabajoID, userID int) ([]dto.VersionResponse, error) {
	trabajo, err := s.repo.FindTrabajoByIDAndUser(ctx, trabajoID, userID)
	if err != nil || trabajo == nil {
		return nil, ErrSinAcceso
	}

	rows, err := s.repo.ListVersionesByTrabajo(ctx, trabajoID)
	if err != nil {
		return nil, err
	}

	out := make([]dto.VersionResponse, 0, len(rows))
	for _, row := range rows {
		out = append(out, dto.VersionResponse{
			IDVersion:          row.IDVersion,
			IDTrabajo:          row.IDTrabajo,
			NumeroVersion:      row.NumeroVersion,
			NombreArchivo:      row.NombreArchivo,
			TamanoBytes:        row.TamanoBytes,
			MimeType:           row.MimeType,
			DescripcionCambios: nullableDescripcion(row),
			EsActual:           row.EsActual,
			FechaEnvio:         formatDateTimeVE(row.FechaEnvio),
		})
	}
	return out, nil
}

func (s *Service) CompareVersiones(ctx context.Context, trabajoID, userID, from, to int) (*dto.CompareVersionsResponse, error) {
	trabajo, err := s.repo.FindTrabajoByIDAndUser(ctx, trabajoID, userID)
	if err != nil || trabajo == nil {
		return nil, ErrSinAcceso
	}

	fromVersion, err := s.repo.FindVersionByTrabajoAndNumber(ctx, trabajoID, from)
	if err != nil || fromVersion == nil {
		return nil, ErrTrabajoNoExiste
	}
	toVersion, err := s.repo.FindVersionByTrabajoAndNumber(ctx, trabajoID, to)
	if err != nil || toVersion == nil {
		return nil, ErrTrabajoNoExiste
	}

	resumen := []string{
		fmt.Sprintf("Versión origen: %d", fromVersion.NumeroVersion),
		fmt.Sprintf("Versión destino: %d", toVersion.NumeroVersion),
		fmt.Sprintf("Archivo origen: %s", fromVersion.NombreArchivo),
		fmt.Sprintf("Archivo destino: %s", toVersion.NombreArchivo),
		fmt.Sprintf("Tamaño origen: %d bytes", fromVersion.TamanoBytes),
		fmt.Sprintf("Tamaño destino: %d bytes", toVersion.TamanoBytes),
		fmt.Sprintf("Cambio reportado en destino: %s", nullableDescripcion(*toVersion)),
	}

	return &dto.CompareVersionsResponse{
		IDTrabajo: trabajo.IDTrabajo,
		From: dto.VersionResponse{
			IDVersion:          fromVersion.IDVersion,
			IDTrabajo:          fromVersion.IDTrabajo,
			NumeroVersion:      fromVersion.NumeroVersion,
			NombreArchivo:      fromVersion.NombreArchivo,
			TamanoBytes:        fromVersion.TamanoBytes,
			MimeType:           fromVersion.MimeType,
			DescripcionCambios: nullableDescripcion(*fromVersion),
			EsActual:           fromVersion.EsActual,
			FechaEnvio:         formatDateTimeVE(fromVersion.FechaEnvio),
		},
		To: dto.VersionResponse{
			IDVersion:          toVersion.IDVersion,
			IDTrabajo:          toVersion.IDTrabajo,
			NumeroVersion:      toVersion.NumeroVersion,
			NombreArchivo:      toVersion.NombreArchivo,
			TamanoBytes:        toVersion.TamanoBytes,
			MimeType:           toVersion.MimeType,
			DescripcionCambios: nullableDescripcion(*toVersion),
			EsActual:           toVersion.EsActual,
			FechaEnvio:         formatDateTimeVE(toVersion.FechaEnvio),
		},
		Resumen: resumen,
	}, nil
}

func (s *Service) GetVersionFile(ctx context.Context, versionID, userID int) (*db.TrabajoCientificoVersionModel, error) {
	version, err := s.repo.FindVersionByID(ctx, versionID)
	if err != nil || version == nil {
		return nil, ErrTrabajoNoExiste
	}

	trabajo, err := s.repo.FindTrabajoByID(ctx, version.IDTrabajo)
	if err != nil || trabajo == nil {
		return nil, ErrTrabajoNoExiste
	}

	if trabajo.IDUsuario == userID {
		return version, nil
	}

	canCommittee, err := s.hasRoleOrAdmin(ctx, userID, "COMITE CIENTIFICO")
	if err != nil {
		return nil, err
	}
	if canCommittee {
		return version, nil
	}

	isAssigned, err := s.repo.IsReviewerAssigned(ctx, version.IDTrabajo, userID)
	if err != nil {
		return nil, err
	}
	if !isAssigned {
		return nil, ErrSinAcceso
	}

	return version, nil
}

func savePDF(trabajoID, eventID, userID, version int, file dto.UploadedFile) (string, error) {
	baseDir := filepath.Join("..", "uploads", "trabajos-cientificos", fmt.Sprintf("evento_%d", eventID), fmt.Sprintf("usuario_%d", userID), fmt.Sprintf("trabajo_%d", trabajoID))
	if err := os.MkdirAll(baseDir, 0o755); err != nil {
		return "", err
	}

	fullPath := filepath.Join(baseDir, fmt.Sprintf("v%d.pdf", version))
	if err := os.WriteFile(fullPath, file.Bytes, 0o644); err != nil {
		return "", err
	}

	return fullPath, nil
}

func DetectPDFContentType(content []byte) string {
	sample := content
	if len(sample) > 512 {
		sample = sample[:512]
	}

	return http.DetectContentType(sample)
}

func normalizeDecisionComite(value string) string {
	v := strings.ToUpper(strings.TrimSpace(value))
	v = strings.ReplaceAll(v, "_", " ")

	switch v {
	case "ACEPTADO":
		return "ACEPTADO"
	case "RECHAZADO":
		return "RECHAZADO"
	case "PENDIENTE DE REVISION":
		return "PENDIENTE_REVISION"
	case "PENDIENTE REVISION":
		return "PENDIENTE_REVISION"
	default:
		return "PENDIENTE_REVISION"
	}
}

func normalizeRecomendacion(value string) string {
	v := strings.ToUpper(strings.TrimSpace(value))
	v = strings.ReplaceAll(v, "_", " ")

	switch v {
	case "ACEPTAR":
		return "ACEPTAR"
	case "RECHAZAR":
		return "RECHAZAR"
	case "PENDIENTE":
		return "PENDIENTE"
	default:
		return "PENDIENTE"
	}
}

func findAuthorName(ctx context.Context, s *Service, userID int) string {
	user, err := s.repo.FindUserByID(ctx, userID)
	if err != nil || user == nil {
		return ""
	}
	return user.Nombre
}

func normalizeTextBlock(value string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
}

func buildEvaluationComments(req dto.SubmitEvaluationRequest) string {
	if normalized := normalizeTextBlock(req.Comentarios); normalized != "" {
		return normalized
	}

	fortalezas := normalizeTextBlock(req.Fortalezas)
	debilidades := normalizeTextBlock(req.Debilidades)
	recomendaciones := normalizeTextBlock(req.Recomendaciones)

	parts := make([]string, 0, 3)
	if fortalezas != "" {
		parts = append(parts, "Fortalezas: "+fortalezas)
	}
	if debilidades != "" {
		parts = append(parts, "Debilidades: "+debilidades)
	}
	if recomendaciones != "" {
		parts = append(parts, "Recomendaciones: "+recomendaciones)
	}

	return strings.Join(parts, "\n")
}

func computeAverageScore(rows []db.TrabajoEvaluacionModel) *float64 {
	total := 0
	count := 0

	for _, row := range rows {
		value, ok := row.Puntaje()
		if !ok {
			continue
		}
		total += value
		count++
	}

	if count == 0 {
		return nil
	}

	avg := float64(total) / float64(count)
	return &avg
}

func buildEvaluationItems(ctx context.Context, s *Service, rows []db.TrabajoEvaluacionModel) []dto.EvaluationItem {
	out := make([]dto.EvaluationItem, 0, len(rows))

	for _, row := range rows {
		reviewerName := ""
		var puntaje *int
		reviewer, findErr := s.repo.FindUserByID(ctx, row.IDRevisor)
		if findErr == nil && reviewer != nil {
			reviewerName = reviewer.Nombre
		}
		if value, ok := row.Puntaje(); ok {
			puntaje = &value
		}

		out = append(out, dto.EvaluationItem{
			IDEvaluacion:  row.IDEvaluacion,
			IDTrabajo:     row.IDTrabajo,
			IDRevisor:     row.IDRevisor,
			Revisor:       reviewerName,
			Recomendacion: row.Recomendacion,
			Puntaje:       puntaje,
			Comentarios:   row.Comentarios,
			UpdatedAt:     formatDateTimeVE(row.UpdatedAt),
		})
	}

	return out
}

func (s *Service) hasRoleOrAdmin(ctx context.Context, userID int, roleName string) (bool, error) {
	hasRole, err := s.repo.UserHasRole(ctx, userID, roleName)
	if err != nil {
		return false, err
	}
	if hasRole {
		return true, nil
	}

	isAdmin, err := s.repo.UserHasRole(ctx, userID, "ADMIN")
	if err != nil {
		return false, err
	}
	return isAdmin, nil
}

func (s *Service) ListTrabajosComite(ctx context.Context, f dto.TrabajoComiteFilter) ([]dto.TrabajoComiteItem, error) {
	hasRole, err := s.hasRoleOrAdmin(ctx, f.UserID, "COMITE CIENTIFICO")
	if err != nil {
		return nil, err
	}
	if !hasRole {
		return nil, ErrSinAcceso
	}

	rows, err := s.repo.ListTrabajosComite(ctx, f)
	if err != nil {
		return nil, err
	}

	out := make([]dto.TrabajoComiteItem, 0, len(rows))
	for _, row := range rows {
		currentVersion, _ := s.repo.FindCurrentVersion(ctx, row.IDTrabajo)
		evaluaciones, _ := s.repo.ListEvaluacionesByTrabajo(ctx, row.IDTrabajo)
		fechaUltimoEnvio := ""
		var archivoActual *dto.VersionResponse
		if currentVersion != nil {
			fechaUltimoEnvio = formatDateTimeVE(currentVersion.FechaEnvio)
			archivoActual = &dto.VersionResponse{
				IDVersion:          currentVersion.IDVersion,
				IDTrabajo:          currentVersion.IDTrabajo,
				NumeroVersion:      currentVersion.NumeroVersion,
				NombreArchivo:      currentVersion.NombreArchivo,
				TamanoBytes:        currentVersion.TamanoBytes,
				MimeType:           currentVersion.MimeType,
				DescripcionCambios: nullableDescripcion(*currentVersion),
				EsActual:           currentVersion.EsActual,
				FechaEnvio:         formatDateTimeVE(currentVersion.FechaEnvio),
			}
		}

		autor := findAuthorName(ctx, s, row.IDUsuario)
		afiliacionAutor, _ := s.repo.FindAuthorAffiliation(ctx, row.IDEvento, row.IDUsuario)
		promedio := computeAverageScore(evaluaciones)
		cantidad := len(evaluaciones)

		out = append(out, dto.TrabajoComiteItem{
			IDTrabajo:                 row.IDTrabajo,
			IDEvento:                  row.IDEvento,
			IDAutor:                   row.IDUsuario,
			Autor:                     autor,
			AfiliacionAutor:           afiliacionAutor,
			Titulo:                    row.Titulo,
			Resumen:                   row.Resumen,
			Estado:                    row.Estado,
			DecisionComite:            normalizeDecisionComite(row.DecisionComite),
			RevisadoPreviamente:       cantidad > 0,
			CantidadEvaluaciones:      cantidad,
			CantidadEvaluacionesOtros: cantidad,
			CalificacionPromedio:      promedio,
			FechaUltimoEnvio:          fechaUltimoEnvio,
			VersionActual:             row.VersionActual,
			ArchivoActual:             archivoActual,
		})
	}

	return out, nil
}

func (s *Service) ListRevisores(ctx context.Context, userID int) ([]dto.ReviewerListItem, error) {
	hasRole, err := s.hasRoleOrAdmin(ctx, userID, "COMITE CIENTIFICO")
	if err != nil {
		return nil, err
	}
	if !hasRole {
		return nil, ErrSinAcceso
	}

	rows, err := s.repo.ListRevisores(ctx)
	if err != nil {
		return nil, err
	}

	out := make([]dto.ReviewerListItem, 0, len(rows))
	for _, row := range rows {
		out = append(out, dto.ReviewerListItem{
			IDUsuario: row.IDUsuario,
			Nombre:    row.Nombre,
			Email:     row.Email,
		})
	}

	return out, nil
}

func (s *Service) AssignReviewers(ctx context.Context, req dto.AssignReviewersRequest) error {
	if req.UserID <= 0 || req.IDTrabajo <= 0 || len(req.Revisores) == 0 {
		return errors.New("datos de asignacion invalidos")
	}

	hasRole, err := s.hasRoleOrAdmin(ctx, req.UserID, "COMITE CIENTIFICO")
	if err != nil {
		return err
	}
	if !hasRole {
		return ErrSinAcceso
	}

	trabajo, err := s.repo.FindTrabajoByID(ctx, req.IDTrabajo)
	if err != nil || trabajo == nil {
		return ErrTrabajoNoExiste
	}

	seen := map[int]struct{}{}
	for _, revisorID := range req.Revisores {
		if revisorID <= 0 {
			continue
		}
		if _, ok := seen[revisorID]; ok {
			continue
		}
		seen[revisorID] = struct{}{}

		isReviewer, roleErr := s.repo.UserHasRole(ctx, revisorID, "REVISOR")
		if roleErr != nil {
			return roleErr
		}
		if !isReviewer {
			return fmt.Errorf("el usuario %d no posee el rol REVISOR", revisorID)
		}

		if err := s.repo.AssignReviewer(ctx, req.IDTrabajo, revisorID, req.UserID); err != nil {
			return err
		}

		_, _ = s.notificationService.CreateNotification(ctx, notificationdto.CreateNotificationRequest{
			UserID:  revisorID,
			EventID: &trabajo.IDEvento,
			Type:    notificationdto.NotificationTypeTrabajoAsignado,
			Message: fmt.Sprintf(notificationdto.MsgTrabajoAsignado, trabajo.Titulo),
		})
	}

	return nil
}

func (s *Service) ListTrabajosAsignadosRevisor(ctx context.Context, userID int) ([]dto.TrabajoComiteItem, error) {
	hasRole, err := s.repo.UserHasRole(ctx, userID, "REVISOR")
	if err != nil {
		return nil, err
	}
	if !hasRole {
		return nil, ErrSinAcceso
	}

	rows, err := s.repo.ListTrabajosAsignadosRevisor(ctx, userID)
	if err != nil {
		return nil, err
	}

	out := make([]dto.TrabajoComiteItem, 0, len(rows))
	for _, row := range rows {
		currentVersion, _ := s.repo.FindCurrentVersion(ctx, row.IDTrabajo)
		evaluaciones, _ := s.repo.ListEvaluacionesByTrabajo(ctx, row.IDTrabajo)
		fechaUltimoEnvio := ""
		var archivoActual *dto.VersionResponse
		if currentVersion != nil {
			fechaUltimoEnvio = formatDateTimeVE(currentVersion.FechaEnvio)
			archivoActual = &dto.VersionResponse{
				IDVersion:          currentVersion.IDVersion,
				IDTrabajo:          currentVersion.IDTrabajo,
				NumeroVersion:      currentVersion.NumeroVersion,
				NombreArchivo:      currentVersion.NombreArchivo,
				TamanoBytes:        currentVersion.TamanoBytes,
				MimeType:           currentVersion.MimeType,
				DescripcionCambios: nullableDescripcion(*currentVersion),
				EsActual:           currentVersion.EsActual,
				FechaEnvio:         formatDateTimeVE(currentVersion.FechaEnvio),
			}
		}

		autor := findAuthorName(ctx, s, row.IDUsuario)
		afiliacionAutor, _ := s.repo.FindAuthorAffiliation(ctx, row.IDEvento, row.IDUsuario)
		promedio := computeAverageScore(evaluaciones)
		cantidad := len(evaluaciones)
		cantidadOtros := 0
		for _, ev := range evaluaciones {
			if ev.IDRevisor != userID {
				cantidadOtros++
			}
		}

		out = append(out, dto.TrabajoComiteItem{
			IDTrabajo:                 row.IDTrabajo,
			IDEvento:                  row.IDEvento,
			IDAutor:                   row.IDUsuario,
			Autor:                     autor,
			AfiliacionAutor:           afiliacionAutor,
			Titulo:                    row.Titulo,
			Resumen:                   row.Resumen,
			Estado:                    row.Estado,
			DecisionComite:            normalizeDecisionComite(row.DecisionComite),
			RevisadoPreviamente:       cantidadOtros > 0,
			CantidadEvaluaciones:      cantidad,
			CantidadEvaluacionesOtros: cantidadOtros,
			CalificacionPromedio:      promedio,
			FechaUltimoEnvio:          fechaUltimoEnvio,
			VersionActual:             row.VersionActual,
			ArchivoActual:             archivoActual,
		})
	}

	return out, nil
}

func (s *Service) SubmitEvaluation(ctx context.Context, req dto.SubmitEvaluationRequest) error {
	if req.UserID <= 0 || req.IDTrabajo <= 0 {
		return errors.New("datos de evaluacion invalidos")
	}

	hasRole, err := s.repo.UserHasRole(ctx, req.UserID, "REVISOR")
	if err != nil {
		return err
	}
	if !hasRole {
		return ErrSinAcceso
	}

	trabajo, err := s.repo.FindTrabajoByID(ctx, req.IDTrabajo)
	if err != nil || trabajo == nil {
		return ErrTrabajoNoExiste
	}

	asignados, err := s.repo.ListTrabajosAsignadosRevisor(ctx, req.UserID)
	if err != nil {
		return err
	}

	assigned := false
	for _, t := range asignados {
		if t.IDTrabajo == req.IDTrabajo {
			assigned = true
			break
		}
	}
	if !assigned {
		return ErrSinAcceso
	}

	req.Recomendacion = normalizeRecomendacion(req.Recomendacion)
	req.Comentarios = buildEvaluationComments(req)
	if req.Comentarios == "" {
		return errors.New("debe registrar observaciones de evaluacion (fortalezas, debilidades o recomendaciones)")
	}
	if req.Puntaje == nil {
		return errors.New("el puntaje es obligatorio y debe estar en una escala de 1 a 5")
	}
	if *req.Puntaje < 1 || *req.Puntaje > 5 {
		return errors.New("el puntaje debe estar entre 1 y 5")
	}

	if err := s.repo.UpsertEvaluacion(ctx, req); err != nil {
		return err
	}

	reviewerLabel := fmt.Sprintf("%d", req.UserID)
	reviewer, reviewerErr := s.repo.FindUserByID(ctx, req.UserID)
	if reviewerErr == nil && reviewer != nil {
		reviewerName := strings.TrimSpace(reviewer.Nombre)
		if reviewerName != "" {
			reviewerLabel = reviewerName
		}
	}

	committeeUsers, _ := s.repo.FindCommitteeUsers(ctx)
	for _, user := range committeeUsers {
		_, _ = s.notificationService.CreateNotification(ctx, notificationdto.CreateNotificationRequest{
			UserID:  user.IDUsuario,
			EventID: &trabajo.IDEvento,
			Type:    notificationdto.NotificationTypeEvaluacionRecibida,
			Message: fmt.Sprintf(notificationdto.MsgEvaluacionRecibida, reviewerLabel, trabajo.Titulo),
		})
	}

	return nil
}

func (s *Service) ListEvaluacionesByTrabajo(ctx context.Context, userID, trabajoID int) (*dto.EvaluationSummary, error) {
	hasRole, err := s.hasRoleOrAdmin(ctx, userID, "COMITE CIENTIFICO")
	if err != nil {
		return nil, err
	}
	if !hasRole {
		return nil, ErrSinAcceso
	}

	trabajo, err := s.repo.FindTrabajoByID(ctx, trabajoID)
	if err != nil || trabajo == nil {
		return nil, ErrTrabajoNoExiste
	}

	rows, err := s.repo.ListEvaluacionesByTrabajo(ctx, trabajoID)
	if err != nil {
		return nil, err
	}

	evaluaciones := buildEvaluationItems(ctx, s, rows)
	return &dto.EvaluationSummary{
		IDTrabajo:            trabajoID,
		CantidadEvaluaciones: len(evaluaciones),
		CalificacionPromedio: computeAverageScore(rows),
		Evaluaciones:         evaluaciones,
	}, nil
}

func (s *Service) DecideTrabajo(ctx context.Context, req dto.DecisionRequest) error {
	if req.UserID <= 0 || req.IDTrabajo <= 0 {
		return errors.New("datos de decision invalidos")
	}

	hasRole, err := s.hasRoleOrAdmin(ctx, req.UserID, "COMITE CIENTIFICO")
	if err != nil {
		return err
	}
	if !hasRole {
		return ErrSinAcceso
	}

	trabajo, err := s.repo.FindTrabajoByID(ctx, req.IDTrabajo)
	if err != nil || trabajo == nil {
		return ErrTrabajoNoExiste
	}

	req.DecisionComite = normalizeDecisionComite(req.DecisionComite)
	req.ComentarioComite = strings.TrimSpace(req.ComentarioComite)

	if err := s.repo.UpdateDecisionComite(ctx, req); err != nil {
		return err
	}

	msg := fmt.Sprintf(notificationdto.MsgEstadoTrabajo, trabajo.Titulo, req.DecisionComite)
	if req.ComentarioComite != "" {
		msg = fmt.Sprintf(notificationdto.MsgEstadoTrabajoConComentario, trabajo.Titulo, req.DecisionComite, req.ComentarioComite)
	}

	_, _ = s.notificationService.CreateNotification(ctx, notificationdto.CreateNotificationRequest{
		UserID:  trabajo.IDUsuario,
		EventID: &trabajo.IDEvento,
		Type:    notificationdto.NotificationTypeEstadoTrabajo,
		Message: msg,
	})

	return nil
}
