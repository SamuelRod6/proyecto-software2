package service

import (
	"context"
	"fmt"
	eventrepo "project/backend/internal/events/repo"
	"project/backend/internal/notifications/dto"
	"project/backend/internal/notifications/repo"
	registrationrepo "project/backend/internal/registrations/repo"
	"project/backend/prisma/db"
	"time"
)

type NotificationService interface {
	CreateNotification(ctx context.Context, req dto.CreateNotificationRequest) (*db.NotificacionModel, error)
	ListNotificationsByUser(ctx context.Context, idUsuario int) ([]db.NotificacionModel, error)
	MarkNotificationAsRead(ctx context.Context, idNotificacion int, leida bool) error
	NotificarCierreInscripciones(ctx context.Context, eventosRepo *eventrepo.Repository, inscripcionesRepo *registrationrepo.Repository) error
	NotificarRecordatorioEvento(ctx context.Context, eventosRepo *eventrepo.Repository, inscripcionesRepo *registrationrepo.Repository) error
	NotificarPagoPendiente(ctx context.Context, eventosRepo *eventrepo.Repository, inscripcionesRepo *registrationrepo.Repository) error
	NotificarAperturaInscripciones(ctx context.Context, evento *db.EventoModel, usuariosRepo *registrationrepo.Repository) error
	NotificarCancelacionEvento(ctx context.Context, evento *db.EventoModel, inscripcionesRepo *registrationrepo.Repository) error
}

type notificationService struct {
	repo repo.NotificationRepository
}

func NewNotificationService(r repo.NotificationRepository) NotificationService {
	return &notificationService{repo: r}
}

func (s *notificationService) CreateNotification(ctx context.Context, req dto.CreateNotificationRequest) (*db.NotificacionModel, error) {
	return s.repo.Create(ctx, req)
}

func (s *notificationService) ListNotificationsByUser(ctx context.Context, idUsuario int) ([]db.NotificacionModel, error) {
	return s.repo.ListByUser(ctx, idUsuario)
}

func (s *notificationService) MarkNotificationAsRead(ctx context.Context, idNotificacion int, leida bool) error {
	return s.repo.MarkAsRead(ctx, idNotificacion, leida)
}

func (s *notificationService) NotificarCierreInscripciones(ctx context.Context, eventosRepo *eventrepo.Repository, inscripcionesRepo *registrationrepo.Repository) error {
	eventos, err := eventosRepo.FindEventosCierreManana(ctx)
	if err != nil {
		return err
	}

	for _, evento := range eventos {
		usuarios, err := inscripcionesRepo.FindUsuariosNoInscritosEnEvento(ctx, evento.IDEvento)
		if err != nil {
			fmt.Println("Error obteniendo usuarios no inscritos para evento", evento.IDEvento, ":", err)
			continue
		}

		for _, usuario := range usuarios {
			// Verificar si ya existe notificación hoy
			exists, err := s.repo.ExistsCierreInscripcionToday(ctx, usuario.IDUsuario, evento.IDEvento)
			if err != nil {
				fmt.Println("Error verificando notificación existente para usuario", usuario.IDUsuario, ":", err)
				continue
			}
			if exists {
				continue
			}
			mensaje := fmt.Sprintf(
				dto.MsgCierreInscripciones,
				evento.Nombre,
				evento.FechaCierreInscripcion.Format("02/01/2006"),
			)
			_, notifErr := s.CreateNotification(ctx, dto.CreateNotificationRequest{
				UserID:  usuario.IDUsuario,
				EventID: &evento.IDEvento,
				Type:    dto.NotificationTypeCierreInscripciones,
				Message: mensaje,
			})
			if notifErr != nil {
				fmt.Println("Error creando notificación de cierre para usuario", usuario.IDUsuario, ":", notifErr)
			}
		}
	}
	return nil
}

func (s *notificationService) NotificarRecordatorioEvento(ctx context.Context, eventosRepo *eventrepo.Repository, inscripcionesRepo *registrationrepo.Repository) error {
	eventos, err := eventosRepo.FindEventosInicioManana(ctx)
	if err != nil {
		return err
	}
	for _, evento := range eventos {
		inscripciones, err := inscripcionesRepo.FindByEventoID(ctx, evento.IDEvento)
		if err != nil {
			fmt.Println("Error obteniendo inscripciones para evento", evento.IDEvento, ":", err)
			continue
		}
		for _, inscripcion := range inscripciones {
			exists, err := s.repo.ExistsNotificationToday(ctx, inscripcion.IDUsuario, evento.IDEvento, dto.NotificationTypeRecordatorioEvento)
			if err != nil {
				fmt.Println("Error verificando notificación existente de recordatorio para usuario", inscripcion.IDUsuario, ":", err)
				continue
			}
			if exists {
				continue
			}
			mensaje := fmt.Sprintf(
				dto.MsgRecordatorioEvento,
				evento.Nombre,
				evento.FechaInicio.Format("02/01/2006"),
			)
			_, notifErr := s.CreateNotification(ctx, dto.CreateNotificationRequest{
				UserID:  inscripcion.IDUsuario,
				EventID: &evento.IDEvento,
				Type:    dto.NotificationTypeRecordatorioEvento,
				Message: mensaje,
			})
			if notifErr != nil {
				fmt.Println("[RecordatorioEvento] Error creando notificación de recordatorio para usuario", inscripcion.IDUsuario, ":", notifErr)
			} else {
				fmt.Printf("[RecordatorioEvento] Notificación de recordatorio creada para usuario %d en evento %d\n", inscripcion.IDUsuario, evento.IDEvento)
			}
		}
	}
	return nil
}
func (s *notificationService) NotificarPagoPendiente(ctx context.Context, eventosRepo *eventrepo.Repository, inscripcionesRepo *registrationrepo.Repository) error {
	inscripciones, err := inscripcionesRepo.FindAll(ctx)
	if err != nil {
		fmt.Println("[PagoPendiente] Error obteniendo inscripciones:", err)
		return err
	}
	now := time.Now().UTC()
	count := 0
	for _, insc := range inscripciones {
		if !insc.EstadoPago {
			evento, err := eventosRepo.FindByID(ctx, insc.IDEvento)
			if err != nil {
				fmt.Println("[PagoPendiente] Error obteniendo evento", insc.IDEvento, ":", err)
				continue
			}
			diasRestantes := evento.FechaInicio.Sub(now).Hours() / 24
			if diasRestantes <= 5 && diasRestantes >= 0 {
				exists, err := s.repo.ExistsNotificationToday(ctx, insc.IDUsuario, evento.IDEvento, dto.NotificationTypeRecordatorioPago)
				if err != nil {
					fmt.Println("Error verificando notificación existente de pago pendiente para usuario", insc.IDUsuario, ":", err)
					continue
				}
				if exists {
					continue
				}
				mensaje := fmt.Sprintf(dto.MsgRecordatorioPago, evento.Nombre, evento.FechaInicio.Format("02/01/2006"))
				_, notifErr := s.CreateNotification(ctx, dto.CreateNotificationRequest{
					UserID:  insc.IDUsuario,
					EventID: &evento.IDEvento,
					Type:    dto.NotificationTypeRecordatorioPago,
					Message: mensaje,
				})
				if notifErr != nil {
					fmt.Println("[PagoPendiente] Error creando notificación de pago pendiente para usuario", insc.IDUsuario, ":", notifErr)
				} else {
					fmt.Printf("[PagoPendiente] Notificación de pago pendiente creada para usuario %d en evento %d\n", insc.IDUsuario, evento.IDEvento)
					count++
				}
			}
		}
	}
	fmt.Printf("[PagoPendiente] Total notificaciones de pago pendiente creadas: %d\n", count)
	return nil
}

func (s *notificationService) NotificarAperturaInscripciones(ctx context.Context, evento *db.EventoModel, usuariosRepo *registrationrepo.Repository) error {
	usuarios, err := usuariosRepo.FindAllUsuarios(ctx)
	if err != nil {
		fmt.Println("[AperturaInscripciones] Error obteniendo usuarios:", err)
		return err
	}
	count := 0
	for _, usuario := range usuarios {
		exists, err := s.repo.ExistsNotificationToday(ctx, usuario.IDUsuario, evento.IDEvento, dto.NotificationTypeAperturaInscripciones)
		if err != nil {
			fmt.Println("Error verificando notificación existente de apertura inscripciones para usuario", usuario.IDUsuario, ":", err)
			continue
		}
		if exists {
			continue
		}
		mensaje := fmt.Sprintf(dto.MsgAperturaInscripciones, evento.Nombre, evento.FechaCierreInscripcion.Format("02/01/2006"))
		_, notifErr := s.CreateNotification(ctx, dto.CreateNotificationRequest{
			UserID:  usuario.IDUsuario,
			EventID: &evento.IDEvento,
			Type:    dto.NotificationTypeAperturaInscripciones,
			Message: mensaje,
		})
		if notifErr != nil {
			fmt.Println("[AperturaInscripciones] Error creando notificación para usuario", usuario.IDUsuario, ":", notifErr)
		} else {
			fmt.Printf("[AperturaInscripciones] Notificación de apertura creada para usuario %d en evento %d\n", usuario.IDUsuario, evento.IDEvento)
			count++
		}
	}
	fmt.Printf("[AperturaInscripciones] Total notificaciones de apertura creadas: %d\n", count)
	return nil
}

func (s *notificationService) NotificarCancelacionEvento(ctx context.Context, evento *db.EventoModel, inscripcionesRepo *registrationrepo.Repository) error {
	inscripciones, err := inscripcionesRepo.FindByEventoID(ctx, evento.IDEvento)
	if err != nil {
		return err
	}
	for _, inscripcion := range inscripciones {
		exists, err := s.repo.ExistsNotificationToday(ctx, inscripcion.IDUsuario, evento.IDEvento, dto.NotificationTypeCancelacionEvento)
		if err != nil {
			fmt.Println("Error verificando notificación existente de cancelación evento para usuario", inscripcion.IDUsuario, ":", err)
			continue
		}
		if exists {
			continue
		}
		_, err = s.CreateNotification(ctx, dto.CreateNotificationRequest{
			UserID:  inscripcion.IDUsuario,
			EventID: &evento.IDEvento,
			Type:    dto.NotificationTypeCancelacionEvento,
			Message: fmt.Sprintf(dto.MsgCancelacionEvento, evento.Nombre),
		})
		if err != nil {
			return err
		}
	}
	return nil
}
