package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	authhandler "project/backend/internal/auth/handler"
	eventhandler "project/backend/internal/events/handler"
	inscripcioneshandler "project/backend/internal/inscripciones/handler"
	paishandler "project/backend/internal/pais/handler"
	permissionhandler "project/backend/internal/permissions/handler"
	registrationhandler "project/backend/internal/registrations/handler"
	rolehandler "project/backend/internal/roles/handler"
	roles "project/backend/internal/roles/service"
	sesioneshandler "project/backend/internal/sesiones/handler"
	smtphandler "project/backend/internal/shared/smtp"
	userhandler "project/backend/internal/users/handler"
	userrepo "project/backend/internal/users/repo"

	notificationcron "project/backend/internal/notifications/cron"
	notificationhandler "project/backend/internal/notifications/handler"

	"project/backend/prisma/db"

	"github.com/joho/godotenv"
)

var prismaClient *db.PrismaClient

func main() {
	envFile := os.Getenv("ENV_FILE")
	if envFile == "" {
		candidates := []string{"../.env", "../.env.local", "../.env.neon"}
		for _, candidate := range candidates {
			if _, err := os.Stat(candidate); err == nil {
				envFile = candidate
				break
			}
		}
	} else if !filepath.IsAbs(envFile) && !strings.HasPrefix(envFile, "../") {
		envFile = filepath.Join("..", envFile)
	}
	if envFile != "" {
		if err := godotenv.Load(envFile); err != nil {
			log.Println("Warning: " + envFile + " file not found")
		} else {
			log.Println("Loaded env file: " + envFile)
		}
	} else {
		log.Println("Warning: no .env file found in project root")
	}
	if strings.TrimSpace(os.Getenv("DATABASE_URL")) == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	prismaClient = db.NewClient()
	if err := prismaClient.Prisma.Connect(); err != nil {
		log.Fatal(err)
	}
	defer func() {
		if err := prismaClient.Prisma.Disconnect(); err != nil {
			log.Println("disconnect error:", err)
		}
	}()

	userRepo := userrepo.NewUserRepository(prismaClient)
	authHandler := authhandler.New(userRepo)
	roleService := roles.NewUserRoleService(prismaClient)
	userHandler := userhandler.New(userRepo, roleService)
	eventsHandler := eventhandler.New(prismaClient)
	inscriptionsHandler := inscripcioneshandler.New(prismaClient)
	paisesHandler := paishandler.New(prismaClient)
	fechasOcupadasHandler := eventhandler.GetFechasOcupadasHandler(eventsHandler.(*eventhandler.Handler).Svc())
	registrationsHandler := registrationhandler.New(prismaClient)
	notificationHandler := notificationhandler.New(prismaClient)
	notificationcron.StartCierreInscripcionesScheduler(prismaClient)
	sesionesHandler := sesioneshandler.New(prismaClient)
	rolesHandler := rolehandler.New(prismaClient)
	permissionsHandler := permissionhandler.New(prismaClient)

	http.HandleFunc("/api/user/assign-role", userHandler.UpdateUserRoleHandler)
	http.HandleFunc("/api/user/assign-roles", userHandler.UpdateUserRolesHandler)

	http.HandleFunc("/api/auth/register", authHandler.RegisterHandler)
	http.HandleFunc("/api/auth/login", authHandler.LoginHandler)
	http.HandleFunc("/api/auth/reset-password", authHandler.ResetPasswordHandler)
	http.HandleFunc("/api/auth/password-recovery/request", authHandler.RequestPasswordRecoveryHandler)
	http.HandleFunc("/api/auth/password-recovery/verify", authHandler.VerifyPasswordRecoveryHandler)
	http.HandleFunc("/api/auth/password-recovery/reset", authHandler.ConfirmPasswordRecoveryHandler)
	http.HandleFunc("/api/auth/logout", authHandler.LogoutHandler)
	http.HandleFunc("/api/smtp/sandbox", smtphandler.SandboxEmailHandler)

	http.HandleFunc("/api/hello", userHandler.HelloHandler)
	http.HandleFunc("/api/users", userHandler.UsersListHandler)
	http.Handle("/api/roles", rolesHandler)
	http.Handle("/api/roles/", rolesHandler)
	http.Handle("/api/permissions", permissionsHandler)
	http.Handle("/api/permissions/", permissionsHandler)
	http.Handle("/api/resources", permissionsHandler)
	http.HandleFunc("/api/users/count", userHandler.UsersCountHandler)

	http.Handle("/api/eventos", eventsHandler)
	http.HandleFunc("/api/eventos/fechas-ocupadas", fechasOcupadasHandler)
	http.Handle("/api/inscripciones", inscriptionsHandler)
	http.HandleFunc("/api/inscripciones/status", inscriptionsHandler.UpdateEstadoHandler)
	http.HandleFunc("/api/inscripciones/historial", inscriptionsHandler.HistorialHandler)
	http.HandleFunc("/api/inscripciones/preferencias", inscriptionsHandler.PreferenciasHandler)
	http.HandleFunc("/api/inscripciones/notificaciones", inscriptionsHandler.NotificacionesHandler)
	http.HandleFunc("/api/inscripciones/comprobante", inscriptionsHandler.ComprobanteHandler)
	http.HandleFunc("/api/inscripciones/reportes", inscriptionsHandler.ReportesHandler)
	http.HandleFunc("/api/inscripciones/reportes/schedule", inscriptionsHandler.ReportesProgramadosHandler)
	http.Handle("/api/registrations", registrationsHandler)
	http.Handle("/api/registrations/", registrationsHandler)
	http.Handle("/api/notifications", notificationHandler)
	http.Handle("/api/notifications/", notificationHandler)
	http.Handle("/api/paises", paisesHandler)
	http.Handle("/api/sesiones", sesionesHandler)
	http.Handle("/api/sesiones/", sesionesHandler)

	if paisHandler, ok := paisesHandler.(*paishandler.Handler); ok {
		http.HandleFunc("/api/ciudades", paisHandler.ListCiudadesByPaisHandler)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("Server listening on :" + port)
	log.Fatal(http.ListenAndServe(":"+port, withCORS(http.DefaultServeMux)))
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Role")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
