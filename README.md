# React + Go Workspace

Este proyecto contiene:

- Frontend en React + TypeScript (Vite)
- Backend en Google Go (API en `backend/cmd/api/main.go`)
- Pruebas unitarias con Jest (frontend)
- Pruebas end-to-end con Cypress
- Colección de Postman para probar el API
- CI con GitHub Actions (archivo en `.github/workflows/ci.yml`)

## Requisitos

- Node.js 18+ (idealmente 20)
- Go 1.20+

## Comandos Frontend

```bash
cd frontend
npm install
npm run dev         # iniciar Vite (desarrollo)
npm run build       # construir
npm run preview     # servir build en 4173
npm run test        # Jest
npm run test:e2e    # Cypress (requiere backend en :8080)
```

## Backend Go

```bash
cd backend
go run ./cmd/api     # inicia el servidor en :8080
go test ./...       # ejecuta pruebas
```

## Postgres + Prisma Client Go

Este backend usa Prisma Client Go con Postgres. Variables en `backend/.env` (Neon) y `backend/.env.local` (Docker local).

Setup (desde `backend/`):

```bash
npm i -D prisma@5.9.1
go install github.com/steebchen/prisma-client-go@latest
PATH="$PATH:$GOPATH/bin" npx prisma generate
npx prisma migrate dev --name init
```

Correr visor Prisma (desde `backend/`):

```bash
npx prisma studio
```

## Makefile (atajos)

```bash
make backend         # inicia backend en :8080
make backend-test    # pruebas Go
make frontend-install # instala deps frontend
make frontend-dev    # Vite dev server (puerto por defecto 5173)
make frontend-build  # build frontend
make frontend-test   # Jest
make frontend-e2e    # Cypress E2E tests
make dev             # levanta backend en segundo plano y Vite dev en primer plano
make dev local       # backend contra Postgres en Docker (backend/.env.local)
make dev server      # backend contra Neon (backend/.env)
```

## Postman

Importa `postman/collection.json` en Postman para probar `GET /api/hello`.

## CI (GitHub Actions)

- Ejecuta pruebas de Go y Jest
- Construye el frontend
- Corre Cypress contra `vite preview` y el backend
