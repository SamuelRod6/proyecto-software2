/*
File: factory.go

Contains:
Factory helpers for constructing notification services.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package service

import (
	"project/backend/internal/notifications/repo"
	"project/backend/prisma/db"
)

// NewNotificationServiceFromClient builds a notification service from a Prisma client.
func NewNotificationServiceFromClient(client *db.PrismaClient) NotificationService {
	notificationRepo := repo.NewNotificationRepository(client)
	return NewNotificationService(notificationRepo)
}
