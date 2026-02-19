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
	lastExec, err := jobExecutionRepo.GetLastRun(ctx, jobName)
	now := time.Now().UTC()
	today8am := time.Date(now.Year(), now.Month(), now.Day(), 8, 0, 0, 0, time.UTC)
	if err == nil && lastExec != nil {
		if lastExec.LastRun.Before(today8am) && now.After(today8am) {
			log.Println("[Catch-up] Ejecutando notificaciones diarias atrasadas...")
			runNotifications(ctx, notificationService, eventRepo, inscripcionRepo)
			log.Println("[Catch-up] Actualizando marca de tiempo...")
			_ = jobExecutionRepo.UpsertLastRun(ctx, jobName, now)
		} else {
			log.Println("[Catch-up] No es necesario ejecutar catch-up (ya ejecutado hoy o antes de la hora)")
		}
	} else if lastExec == nil && now.After(today8am) {
		log.Println("[Catch-up] Ejecutando notificaciones diarias por primera vez...")
		runNotifications(ctx, notificationService, eventRepo, inscripcionRepo)
		log.Println("[Catch-up] Actualizando marca de tiempo...")
		_ = jobExecutionRepo.UpsertLastRun(ctx, jobName, now)
	} else {
		log.Println("[Catch-up] No se ejecuta (antes de la hora o error inesperado)")
	}

	c := cron.New()
	c.AddFunc("0 8 * * *", func() {
		ctx := context.Background()
		runNotifications(ctx, notificationService, eventRepo, inscripcionRepo)
		_ = jobExecutionRepo.UpsertLastRun(ctx, jobName, time.Now().UTC())
	})
	c.Start()
}

func runNotifications(ctx context.Context, notificationService notificationsrv.NotificationService, eventRepo *eventrepo.Repository, inscripcionRepo *registrationrepo.Repository) {
	err := notificationService.NotificarCierreInscripciones(ctx, eventRepo, inscripcionRepo)
	if err != nil {
		log.Println("Error en notificación de cierre de inscripciones:", err)
	}

	err = notificationService.NotificarRecordatorioEvento(ctx, eventRepo, inscripcionRepo)
	if err != nil {
		log.Println("Error en notificación de recordatorio de evento:", err)
	}

	err = notificationService.NotificarPagoPendiente(ctx, eventRepo, inscripcionRepo)
	if err != nil {
		log.Println("Error en notificación de pago pendiente:", err)
	}
}
