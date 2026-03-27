package service

import (
	"context"
	"errors"
	"fmt"
	notificationdto "project/backend/internal/notifications/dto"
	notificationsrepo "project/backend/internal/notifications/repo"
	notificationsrv "project/backend/internal/notifications/service"
	"project/backend/internal/sesiones/dto"
	"project/backend/internal/sesiones/repo"
	validation "project/backend/internal/sesiones/validation"
	"project/backend/prisma/db"
	"time"
)

type Service struct {
	repo                *repo.Repository
	notificationService notificationsrv.NotificationService
}

func New(prismaClient *db.PrismaClient) *Service {
	sesionRepo := repo.NewRepository(prismaClient)
	notificationRepo := notificationsrepo.NewNotificationRepository(prismaClient)
	notificationService := notificationsrv.NewNotificationService(notificationRepo)

	return &Service{
		repo:                sesionRepo,
		notificationService: notificationService,
	}
}

var (
	ErrNotFound = errors.New("Sesión no encontrada")
	ErrDB       = errors.New("db error")
	ErrInvalid  = errors.New("datos inválidos")
)

var venezuelaLocation = time.FixedZone("VET", -4*60*60)

func formatDateTimeVE(t time.Time) string {
	// Normaliza a UTC y aplica UTC-4 para evitar depender de la ubicación original.
	return t.UTC().In(venezuelaLocation).Format("02/01/2006 15:04")
}

func (s *Service) CreateSesion(ctx context.Context, eventoID int, req dto.CreateSesionRequest) (*dto.SesionResponse, error) {
	if req.Titulo == "" || req.FechaInicio == "" || req.FechaFin == "" {
		println("[CreateSesion] Título o fechas vacíos")
		return nil, ErrInvalid
	}
	println("[CreateSesion] Buscando evento", eventoID)
	evento, err := s.repo.Prisma().Evento.FindUnique(db.Evento.IDEvento.Equals(eventoID)).Exec(ctx)
	if err != nil || evento == nil {
		println("[CreateSesion] Evento no encontrado")
		return nil, errors.New("Evento no encontrado")
	}
	println("[CreateSesion] Validando evento no iniciado")
	if err := validation.ValidarEventoNoIniciado(evento); err != nil {
		println("[CreateSesion] Validación evento no iniciado falló:", err.Error())
		return nil, err
	}
	println("[CreateSesion] Parseando fechas")
	fechaInicio, err := time.Parse(time.RFC3339, req.FechaInicio)
	if err != nil {
		println("[CreateSesion] Fecha de inicio inválida")
		return nil, errors.New("Fecha de inicio inválida")
	}
	fechaFin, err := time.Parse(time.RFC3339, req.FechaFin)
	if err != nil {
		println("[CreateSesion] Fecha de fin inválida")
		return nil, errors.New("Fecha de fin inválida")
	}

	println("[CreateSesion] Validando rango de fechas de la sesión respecto al evento")
	if err := validation.ValidarSesionDentroDeRangoEvento(fechaInicio, fechaFin, evento.FechaInicio, evento.FechaFin); err != nil {
		println("[CreateSesion] Validación rango de fechas falló:", err.Error())
		return nil, err
	}

	println("[CreateSesion] Validando duración")
	if err := validation.ValidarDuracion(fechaInicio, fechaFin); err != nil {
		println("[CreateSesion] Validación duración falló:", err.Error())
		return nil, err
	}
	println("[CreateSesion] Listando sesiones del evento")
	sesiones, err := s.repo.ListSesiones(ctx, eventoID)
	if err != nil {
		println("[CreateSesion] Error al listar sesiones")
		return nil, ErrDB
	}
	println("[CreateSesion] Validando título único")
	if err := validation.ValidarTituloUnico(sesiones, req.Titulo); err != nil {
		println("[CreateSesion] Validación título único falló:", err.Error())
		return nil, err
	}
	println("[CreateSesion] Validando solapamiento")
	if err := validation.ValidarSolapamiento(sesiones, fechaInicio, fechaFin); err != nil {
		println("[CreateSesion] Validación solapamiento falló:", err.Error())
		return nil, err
	}
	println("[CreateSesion] Creando sesión en BD")
	id, err := s.repo.CreateSesion(ctx, eventoID, req.Titulo, req.Descripcion, req.FechaInicio, req.FechaFin, req.Ubicacion)
	if err != nil {
		println("[CreateSesion] Error al crear sesión en BD:", err.Error())
		return nil, ErrDB
	}
	println("[CreateSesion] Obteniendo sesión creada")
	sesion, err := s.repo.GetSesionByID(ctx, id)
	if err != nil || sesion == nil {
		println("[CreateSesion] Error al obtener sesión creada")
		return nil, ErrDB
	}
	println("[CreateSesion] Sesión creada OK")
	return s.mapSesionToResponse(ctx, sesion), nil
}

func (s *Service) ListSesiones(ctx context.Context, eventoID int) ([]dto.SesionResponse, error) {
	sesiones, err := s.repo.ListSesiones(ctx, eventoID)
	if err != nil {
		return nil, ErrDB
	}
	var resp []dto.SesionResponse
	for _, sesion := range sesiones {
		resp = append(resp, *s.mapSesionToResponse(ctx, &sesion))
	}
	return resp, nil
}

func (s *Service) GetSesionByID(ctx context.Context, sesionID int) (*dto.SesionResponse, error) {
	sesion, err := s.repo.GetSesionByID(ctx, sesionID)
	if err != nil || sesion == nil {
		return nil, ErrNotFound
	}
	return s.mapSesionToResponse(ctx, sesion), nil
}

func (s *Service) UpdateSesion(ctx context.Context, sesionID int, req dto.UpdateSesionRequest) (*dto.SesionResponse, error) {
	if req.Titulo == "" || req.FechaInicio == "" || req.FechaFin == "" {
		return nil, ErrInvalid
	}
	sesion, err := s.repo.GetSesionByID(ctx, sesionID)
	if err != nil || sesion == nil {
		return nil, ErrNotFound
	}
	if err := validation.ValidarSesionNoCancelada(sesion); err != nil {
		return nil, err
	}
	evento, err := s.repo.Prisma().Evento.FindUnique(db.Evento.IDEvento.Equals(sesion.IDEvento)).Exec(ctx)
	if err != nil || evento == nil {
		return nil, errors.New("Evento no encontrado")
	}
	ahora := time.Now()
	if evento.FechaInicio.Before(ahora) {
		return nil, errors.New("No se pueden modificar sesiones de eventos ya iniciados")
	}
	if err := validation.ValidarEventoNoIniciado(evento); err != nil {
		return nil, err
	}
	fechaInicio, err := time.Parse(time.RFC3339, req.FechaInicio)
	if err != nil {
		return nil, errors.New("Fecha de inicio inválida")
	}
	fechaFin, err := time.Parse(time.RFC3339, req.FechaFin)
	if err != nil {
		return nil, errors.New("Fecha de fin inválida")
	}
	if err := validation.ValidarDuracion(fechaInicio, fechaFin); err != nil {
		return nil, err
	}
	sesiones, err := s.repo.ListSesiones(ctx, sesion.IDEvento)
	if err != nil {
		return nil, ErrDB
	}
	var otrasSesiones []db.SesionModel
	for _, s := range sesiones {
		if s.IDSesion != sesionID {
			otrasSesiones = append(otrasSesiones, s)
		}
	}
	if err := validation.ValidarTituloUnico(otrasSesiones, req.Titulo); err != nil {
		return nil, err
	}
	if err := validation.ValidarSolapamiento(otrasSesiones, fechaInicio, fechaFin); err != nil {
		return nil, err
	}
	antes := fmt.Sprintf("titulo=%s|inicio=%s|fin=%s|ubicacion=%s",
		sesion.Titulo,
		sesion.FechaInicio.Format(time.RFC3339),
		sesion.FechaFin.Format(time.RFC3339),
		sesion.Ubicacion,
	)

	err = s.repo.UpdateSesion(ctx, sesionID, req.Titulo, req.Descripcion, req.FechaInicio, req.FechaFin, req.Ubicacion)
	if err != nil {
		return nil, ErrDB
	}
	sesion, err = s.repo.GetSesionByID(ctx, sesionID)
	if err != nil || sesion == nil {
		return nil, ErrDB
	}
	despues := fmt.Sprintf("titulo=%s|inicio=%s|fin=%s|ubicacion=%s",
		sesion.Titulo,
		sesion.FechaInicio.Format(time.RFC3339),
		sesion.FechaFin.Format(time.RFC3339),
		sesion.Ubicacion,
	)

	_ = s.repo.RegistrarHistorialSesion(
		ctx,
		sesionID,
		"UPDATE_SESION",
		"Actualización de datos de la sesión",
		"coordinador",
		antes,
		despues,
	)

	// Notificar a ponentes asignados sobre cambios en la sesión
	ponentesAsignados, err := s.repo.ListPonentes(ctx, sesionID)
	if err == nil {
		for _, p := range ponentesAsignados {
			eventID := evento.IDEvento
			_, notifErr := s.notificationService.CreateNotification(ctx, notificationdto.CreateNotificationRequest{
				UserID:  p.IDUsuario,
				EventID: &eventID,
				Type:    notificationdto.NotificationTypeCambioSesion,
				Message: fmt.Sprintf(
					"La sesión '%s' del evento '%s' ha sido actualizada. Nuevo horario: %s - %s.",
					sesion.Titulo,
					evento.Nombre,
					formatDateTimeVE(sesion.FechaInicio),
					formatDateTimeVE(sesion.FechaFin),
				),
			})
			if notifErr != nil {
				fmt.Println("[UpdateSesion] Error notificando cambio de sesión:", notifErr)
			}
		}
	}

	return s.mapSesionToResponse(ctx, sesion), nil
}

func (s *Service) DeleteSesion(ctx context.Context, sesionID int) error {
	err := s.repo.DeleteSesion(ctx, sesionID)
	if err != nil {
		return ErrDB
	}
	return nil
}

func (svc *Service) mapSesionToResponse(ctx context.Context, sesion *db.SesionModel) *dto.SesionResponse {
	if sesion == nil {
		return nil
	}
	ponentes, err := svc.ListPonentes(ctx, sesion.IDSesion)
	if err != nil || ponentes == nil {
		ponentes = make([]dto.PonenteResponse, 0)
	}
	return &dto.SesionResponse{
		IDSesion:    sesion.IDSesion,
		Titulo:      sesion.Titulo,
		Descripcion: sesion.Descripcion,
		FechaInicio: formatDateTimeVE(sesion.FechaInicio),
		FechaFin:    formatDateTimeVE(sesion.FechaFin),
		Ubicacion:   sesion.Ubicacion,
		EventoID:    sesion.IDEvento,
		Ponentes:    ponentes,
	}
}

func (s *Service) AsignarPonentes(ctx context.Context, sesionID int, req dto.AsignarPonentesRequest) error {
	if len(req.Usuarios) == 0 {
		return ErrInvalid
	}

	sesion, err := s.repo.GetSesionByID(ctx, sesionID)
	if err != nil || sesion == nil {
		return ErrNotFound
	}
	if err := validation.ValidarSesionNoCancelada(sesion); err != nil {
		return err
	}

	evento, err := s.repo.Prisma().Evento.FindUnique(db.Evento.IDEvento.Equals(sesion.IDEvento)).Exec(ctx)
	if err != nil || evento == nil {
		return errors.New("Evento no encontrado")
	}
	if err := validation.ValidarEventoNoIniciado(evento); err != nil {
		return err
	}

	var usuarios []db.UsuarioModel
	for _, id := range req.Usuarios {
		u, err := s.repo.Prisma().Usuario.
			FindUnique(db.Usuario.IDUsuario.Equals(id)).
			With(db.Usuario.UsuarioRoles.Fetch().With(db.UsuarioRoles.Rol.Fetch())).
			Exec(ctx)
		if err != nil || u == nil {
			return errors.New("Usuario no encontrado")
		}
		usuarios = append(usuarios, *u)
	}

	if err := validation.ValidarRolPonente(usuarios); err != nil {
		return err
	}

	// Validar disponibilidad por solapamiento horario
	for _, userID := range req.Usuarios {
		conflicto, err := s.repo.UsuarioTieneConflictoHorario(ctx, userID, sesionID)

		if err != nil {
			return ErrDB
		}

		if conflicto {
			return errors.New("Uno de los ponentes ya está asignado a otra sesión en el mismo horario")
		}
	}

	// Persistir asignaciones
	if err = s.repo.AsignarPonentes(ctx, sesionID, req.Usuarios); err != nil {
		return ErrDB
	}

	// Notificar a cada ponente asignado
	for _, userID := range req.Usuarios {
		eventID := evento.IDEvento
		_, notifErr := s.notificationService.CreateNotification(ctx, notificationdto.CreateNotificationRequest{
			UserID:  userID,
			EventID: &eventID,
			Type:    notificationdto.NotificationTypeCambioEvento,
			Message: fmt.Sprintf(
				"Has sido asignado como ponente en la sesión '%s' del evento '%s'. Horario: %s - %s.",
				sesion.Titulo,
				evento.Nombre,
				formatDateTimeVE(sesion.FechaInicio),
				formatDateTimeVE(sesion.FechaFin),
			),
		})

		if notifErr != nil {
			fmt.Println("[AsignarPonentes] Error creando notificación:", notifErr)
		}
	}
	
	return nil
}

func (s *Service) QuitarPonente(ctx context.Context, sesionID int, usuarioID int) error {
	err := s.repo.QuitarPonente(ctx, sesionID, usuarioID)
	if err != nil {
		return ErrDB
	}
	return nil
}

func (s *Service) ListPonentes(ctx context.Context, sesionID int) ([]dto.PonenteResponse, error) {
	usuarios, err := s.repo.ListPonentes(ctx, sesionID)
	if err != nil {
		return make([]dto.PonenteResponse, 0), nil
	}
	var resp []dto.PonenteResponse
	for _, u := range usuarios {
		resp = append(resp, dto.PonenteResponse{
			IDUsuario: u.IDUsuario,
			Nombre:    u.Nombre,
			Email:     u.Email,
		})
	}
	if resp == nil {
		resp = make([]dto.PonenteResponse, 0)
	}
	return resp, nil
}

func (s *Service) ListPonentesAsignables(ctx context.Context, sesionID int) ([]dto.PonenteAsignableResponse, error) {
	sesion, err := s.repo.GetSesionByID(ctx, sesionID)
	if err != nil || sesion == nil {
		return nil, ErrNotFound
	}
	if sesion.Cancelado {
		return nil, errors.New("Sesión cancelada")
	}
	usuarios, err := s.repo.ListPonentesAsignables(ctx, sesionID)
	if err != nil {
		return make([]dto.PonenteAsignableResponse, 0), nil
	}
	var resp []dto.PonenteAsignableResponse
	for _, u := range usuarios {
		resp = append(resp, dto.PonenteAsignableResponse{
			IDUsuario: u.IDUsuario,
			Nombre:    u.Nombre,
			Email:     u.Email,
		})
	}
	if resp == nil {
		resp = make([]dto.PonenteAsignableResponse, 0)
	}
	return resp, nil
}
