package cron

import (
	"context"
	"log"
	eventrepo "project/backend/internal/events/repo"
	notificationsrepo "project/backend/internal/notifications/repo"
	notificationsrv "project/backend/internal/notifications/service"
	registrationrepo "project/backend/internal/registrations/repo"
	"project/backend/prisma/db"
	"time"

	"github.com/robfig/cron/v3"
)

func StartCierreInscripcionesScheduler(prismaClient *db.PrismaClient) {
	eventRepo := eventrepo.New(prismaClient)
	inscripcionRepo := registrationrepo.New(prismaClient)
	notificationRepo := notificationsrepo.NewNotificationRepository(prismaClient)
	notificationService := notificationsrv.NewNotificationService(notificationRepo)
	jobExecutionRepo := notificationsrepo.NewJobExecutionRepository(prismaClient)
	jobName := "notificaciones_diarias"
	ctx := context.Background()
	// Ejecutar catch-up siempre al iniciar el backend
	log.Println("[Catch-up] Ejecutando notificaciones pendientes al iniciar backend...")
	err := runNotifications(ctx, notificationService, eventRepo, inscripcionRepo)
	if err == nil {
		log.Println("[Catch-up] Actualizando marca de tiempo...")
		_ = jobExecutionRepo.UpsertLastRun(ctx, jobName, time.Now().UTC())
	} else {
		log.Println("[Catch-up] Error al ejecutar notificaciones al iniciar backend:", err)
	}

	c := cron.New()
	c.AddFunc("@every 5m", func() {
		ctx := context.Background()
		err := runNotifications(ctx, notificationService, eventRepo, inscripcionRepo)
		if err == nil {
			_ = jobExecutionRepo.UpsertLastRun(ctx, jobName, time.Now().UTC())
		} else {
			log.Println("[Catch-up] Error al ejecutar notificaciones en cron:", err)
		}
	})
	c.Start()
}

func runNotifications(ctx context.Context, notificationService notificationsrv.NotificationService, eventRepo *eventrepo.Repository, inscripcionRepo *registrationrepo.Repository) error {
	if err := notificationService.NotificarCierreInscripciones(ctx, eventRepo, inscripcionRepo); err != nil {
		log.Println("Error en notificación de cierre de inscripciones:", err)
		return err
	}
	if err := notificationService.NotificarRecordatorioEvento(ctx, eventRepo, inscripcionRepo); err != nil {
		log.Println("Error en notificación de recordatorio de evento:", err)
		return err
	}
	if err := notificationService.NotificarPagoPendiente(ctx, eventRepo, inscripcionRepo); err != nil {
		log.Println("Error en notificación de pago pendiente:", err)
		return err
	}
	return nil
}
