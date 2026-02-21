package service

import (
	"project/backend/internal/notifications/repo"
	"project/backend/prisma/db"
)

func NewNotificationServiceFromClient(client *db.PrismaClient) NotificationService {
	notificationRepo := repo.NewNotificationRepository(client)
	return NewNotificationService(notificationRepo)
}
