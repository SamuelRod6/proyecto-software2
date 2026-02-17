package main

import (
	"log"
	"net/http"
	"os"

	authhandler "project/backend/internal/auth/handler"
	eventhandler "project/backend/internal/events/handler"
	registrationhandler "project/backend/internal/registrations/handler"
	"project/backend/internal/roles"
	userhandler "project/backend/internal/users/handler"
	userrepo "project/backend/internal/users/repo"
	"project/backend/prisma/db"

	"github.com/joho/godotenv"
)

var prismaClient *db.PrismaClient

func main() {
	envFile := os.Getenv("ENV_FILE")
	if envFile == "" {
		envFile = ".env"
	}
	if err := godotenv.Load(envFile); err != nil {
		log.Println("Warning: " + envFile + " file not found")
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
	fechasOcupadasHandler := eventhandler.GetFechasOcupadasHandler(eventsHandler.(*eventhandler.Handler).Svc())
	registrationsHandler := registrationhandler.New(prismaClient)

	http.HandleFunc("/api/user/assign-role", userHandler.UpdateUserRoleHandler)

	http.HandleFunc("/api/auth/register", authHandler.RegisterHandler)
	http.HandleFunc("/api/auth/login", authHandler.LoginHandler)
	http.HandleFunc("/api/auth/reset-password", authHandler.ResetPasswordHandler)
	http.HandleFunc("/api/auth/logout", authHandler.LogoutHandler)

	http.HandleFunc("/api/hello", userHandler.HelloHandler)
	http.HandleFunc("/api/users", userHandler.UsersListHandler)
	http.HandleFunc("/api/roles", userHandler.RolesListHandler)
	http.HandleFunc("/api/users/count", userHandler.UsersCountHandler)

	http.Handle("/api/eventos", eventsHandler)
	http.HandleFunc("/api/eventos/fechas-ocupadas", fechasOcupadasHandler)
	http.Handle("/api/inscripciones", registrationsHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("Server listening on :" + port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
