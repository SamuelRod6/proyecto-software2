/*
File: repo.go

Contains:
Persistence repository implementation for notifications.
It provides data access for notification storage, listing, and
daily-existence checks used by scheduled jobs.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package repo

import (
	"context"
	"fmt"
	"project/backend/internal/notifications/dto"
	"project/backend/prisma/db"
	"time"
)

// NotificationRepository defines the persistence contract for notifications.
type NotificationRepository interface {
	Create(ctx context.Context, req dto.CreateNotificationRequest) (*db.NotificacionModel, error)
	ListByUser(ctx context.Context, idUsuario int) ([]db.NotificacionModel, error)
	MarkAsRead(ctx context.Context, idNotificacion int, leida bool) error
	ExistsCierreInscripcionToday(ctx context.Context, userID int, eventID int) (bool, error)
	ExistsNotificationToday(ctx context.Context, userID int, eventID int, tipo string) (bool, error)
	FindUserEmailByID(ctx context.Context, userID int) (string, error)
}

// notificationRepository implements NotificationRepository using Prisma.
type notificationRepository struct {
	client *db.PrismaClient
}

// NewNotificationRepository creates a notification repository.
func NewNotificationRepository(client *db.PrismaClient) NotificationRepository {
	return &notificationRepository{client: client}
}

// Create stores a notification record.
func (r *notificationRepository) Create(ctx context.Context, req dto.CreateNotificationRequest) (*db.NotificacionModel, error) {
	setMensaje := db.Notificacion.Mensaje.Set(req.Message)
	setUsuario := db.Notificacion.Usuario.Link(
		db.Usuario.IDUsuario.Equals(req.UserID),
	)

	var optionals []db.NotificacionSetParam
	if req.Type != "" {
		optionals = append(optionals, db.Notificacion.Tipo.Set(req.Type))
	}
	if req.EventID != nil {
		optionals = append(optionals, db.Notificacion.Evento.Link(
			db.Evento.IDEvento.Equals(*req.EventID),
		))
	}

	notification, err := r.client.Notificacion.CreateOne(
		setMensaje, setUsuario,
		optionals...,
	).Exec(ctx)
	if err != nil {
		fmt.Println("Error en repo al crear notificación:", err)
		return nil, err
	}
	fmt.Println("Notificación insertada en base de datos:", notification)
	return notification, nil
}

// ListByUser returns notifications ordered by newest first.
func (r *notificationRepository) ListByUser(ctx context.Context, idUsuario int) ([]db.NotificacionModel, error) {
	return r.client.Notificacion.FindMany(
		db.Notificacion.IDUsuario.Equals(idUsuario),
	).OrderBy(
		db.Notificacion.CreatedAt.Order(db.SortOrderDesc),
	).Exec(ctx)
}

// MarkAsRead updates the read state of one notification.
func (r *notificationRepository) MarkAsRead(ctx context.Context, idNotificacion int, leida bool) error {
	_, err := r.client.Notificacion.FindUnique(
		db.Notificacion.IDNotificacion.Equals(idNotificacion),
	).Update(
		db.Notificacion.Leida.Set(leida),
	).Exec(ctx)
	return err
}

// ExistsCierreInscripcionToday checks whether a close-inscription notification
// already exists today for a user and event.
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

// ExistsNotificationToday checks whether a notification of the same type was
// already created today for a user and event.
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

// FindUserEmailByID retrieves the email for one user.
func (r *notificationRepository) FindUserEmailByID(ctx context.Context, userID int) (string, error) {
    user, err := r.client.Usuario.FindUnique(
        db.Usuario.IDUsuario.Equals(userID),
    ).Exec(ctx)
    if err != nil {
        return "", err
    }
    if user == nil {
        return "", fmt.Errorf("usuario %d no encontrado", userID)
    }
    return user.Email, nil
}