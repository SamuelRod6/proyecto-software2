package main

import (
	"log"
	"net/http"
	"os"

	authhandler "project/backend/internal/auth/handler"
	eventhandler "project/backend/internal/events/handler"
	permissionhandler "project/backend/internal/permissions/handler"
	rolehandler "project/backend/internal/roles/handler"
	roles "project/backend/internal/roles/service"
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
	rolesHandler := rolehandler.New(prismaClient)
	permissionsHandler := permissionhandler.New(prismaClient)

	http.HandleFunc("/api/user/assign-role", userHandler.UpdateUserRoleHandler)
	http.HandleFunc("/api/user/assign-roles", userHandler.UpdateUserRolesHandler)

	http.HandleFunc("/api/auth/register", authHandler.RegisterHandler)
	http.HandleFunc("/api/auth/login", authHandler.LoginHandler)
	http.HandleFunc("/api/auth/reset-password", authHandler.ResetPasswordHandler)
	http.HandleFunc("/api/auth/logout", authHandler.LogoutHandler)

	http.HandleFunc("/api/hello", userHandler.HelloHandler)
	http.HandleFunc("/api/users", userHandler.UsersListHandler)
	http.Handle("/api/roles", rolesHandler)
	http.Handle("/api/roles/", rolesHandler)
	http.Handle("/api/permissions", permissionsHandler)
	http.Handle("/api/permissions/", permissionsHandler)
	http.Handle("/api/resources", permissionsHandler)
	http.HandleFunc("/api/users/count", userHandler.UsersCountHandler)

	http.Handle("/api/eventos", eventsHandler)

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
