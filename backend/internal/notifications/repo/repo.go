package repo

import (
	"context"
	"fmt"
	"project/backend/internal/notifications/dto"
	"project/backend/prisma/db"
	"time"
)

type NotificationRepository interface {
	Create(ctx context.Context, req dto.CreateNotificationRequest) (*db.NotificacionModel, error)
	ListByUser(ctx context.Context, idUsuario int) ([]db.NotificacionModel, error)
	MarkAsRead(ctx context.Context, idNotificacion int, leida bool) error
	ExistsCierreInscripcionToday(ctx context.Context, userID int, eventID int) (bool, error)
	ExistsNotificationToday(ctx context.Context, userID int, eventID int, tipo string) (bool, error)
}

type notificationRepository struct {
	client *db.PrismaClient
}

func NewNotificationRepository(client *db.PrismaClient) NotificationRepository {
	return &notificationRepository{client: client}
}

func (r *notificationRepository) Create(ctx context.Context, req dto.CreateNotificationRequest) (*db.NotificacionModel, error) {
	setTipo := db.Notificacion.Tipo.Set(req.Type)
	setMensaje := db.Notificacion.Mensaje.Set(req.Message)
	setUsuario := db.Notificacion.Usuario.Link(
		db.Usuario.IDUsuario.Equals(req.UserID),
	)

	var optionals []db.NotificacionSetParam
	if req.EventID != nil {
		optionals = append(optionals, db.Notificacion.Evento.Link(
			db.Evento.IDEvento.Equals(*req.EventID),
		))
	}

	notification, err := r.client.Notificacion.CreateOne(
		setTipo, setMensaje, setUsuario,
		optionals...,
	).Exec(ctx)
	if err != nil {
		fmt.Println("Error en repo al crear notificación:", err)
		return nil, err
	}
	fmt.Println("Notificación insertada en base de datos:", notification)
	return notification, nil
}

func (r *notificationRepository) ListByUser(ctx context.Context, idUsuario int) ([]db.NotificacionModel, error) {
	return r.client.Notificacion.FindMany(
		db.Notificacion.IDUsuario.Equals(idUsuario),
	).OrderBy(
		db.Notificacion.CreatedAt.Order(db.SortOrderDesc),
	).Exec(ctx)
}

func (r *notificationRepository) MarkAsRead(ctx context.Context, idNotificacion int, leida bool) error {
	_, err := r.client.Notificacion.FindUnique(
		db.Notificacion.IDNotificacion.Equals(idNotificacion),
	).Update(
		db.Notificacion.Leida.Set(leida),
	).Exec(ctx)
	return err
}

func (r *notificationRepository) ExistsCierreInscripcionToday(ctx context.Context, userID int, eventID int) (bool, error) {
	now := time.Now().UTC()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	endOfDay := startOfDay.Add(24 * time.Hour)
	notif, err := r.client.Notificacion.FindFirst(
		db.Notificacion.IDUsuario.Equals(userID),
		db.Notificacion.IDEvento.Equals(eventID),
		db.Notificacion.Tipo.Equals("cierre_inscripciones"),
		db.Notificacion.CreatedAt.Gte(startOfDay),
		db.Notificacion.CreatedAt.Lt(endOfDay),
	).Exec(ctx)
	if err != nil && err.Error() != "ErrNotFound" {
		return false, err
	}
	return notif != nil, nil
}

func (r *notificationRepository) ExistsNotificationToday(ctx context.Context, userID int, eventID int, tipo string) (bool, error) {
	now := time.Now().UTC()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	endOfDay := startOfDay.Add(24 * time.Hour)
	notif, err := r.client.Notificacion.FindFirst(
		db.Notificacion.IDUsuario.Equals(userID),
		db.Notificacion.IDEvento.Equals(eventID),
		db.Notificacion.Tipo.Equals(tipo),
		db.Notificacion.CreatedAt.Gte(startOfDay),
		db.Notificacion.CreatedAt.Lt(endOfDay),
	).Exec(ctx)
	if err != nil && err.Error() != "ErrNotFound" {
		return false, err
	}
	return notif != nil, nil
}
