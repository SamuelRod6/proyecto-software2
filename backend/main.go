package main

import (
	"log"
	"net/http"

	"project/backend/prisma/db"

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

	http.HandleFunc("/api/hello", HelloHandler)
	http.HandleFunc("/api/users-count", UsersCountHandler)
	log.Println("Server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
