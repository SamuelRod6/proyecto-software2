package main

import (
	"log"
	"net/http"
	"os"

	"project/backend/handlers"
	"project/backend/prisma/db"
	"project/backend/repository"
	"project/backend/services"

	"github.com/joho/godotenv"
)

var prismaClient *db.PrismaClient

func main() {
	// Cargar variables de entorno desde .env
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
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

	// Initialize repository and handlers
	userRepo := repository.NewUserRepository(prismaClient)
	roleService := services.NewUserRoleService(prismaClient)
	authHandler := handlers.NewAuthHandler(userRepo)
	userHandler := handlers.NewUserHandler(userRepo, roleService)

	// Auth routes
	http.HandleFunc("/api/auth/register", authHandler.RegisterHandler)
	http.HandleFunc("/api/auth/login", authHandler.LoginHandler)
	http.HandleFunc("/api/auth/reset-password", authHandler.ResetPasswordHandler)

	// User routes
	http.HandleFunc("/api/hello", userHandler.HelloHandler)
	http.HandleFunc("/api/admin/assign-role", userHandler.UpdateUserRoleHandler)
	http.HandleFunc("/api/users/count", userHandler.UsersCountHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("Server listening on :" + port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
