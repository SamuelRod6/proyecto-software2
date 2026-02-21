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

## Estructura del proyecto

- `frontend/`: app React + Vite (UI, rutas, servicios, estilos)
- `backend/`: API Go (entrypoint en `cmd/api/main.go`)
- `backend/internal/`: modulos del dominio (handlers, servicios, repos, DTOs, validaciones)
- `backend/prisma/`: schema y migraciones
- `postman/`: coleccion de requests

## Agregar nuevos módulos (backend)

Pasos recomendados:

1) Crear carpeta en `backend/internal/<modulo>/` con estructura similar a `users` o `events`:
	- `handler/` para HTTP handlers
	- `service/` para logica de negocio
	- `repo/` para acceso a datos
	- `dto/` y `validation/` si aplica
2) Registrar rutas en `backend/cmd/api/main.go`.
3) Si hay cambios de datos, actualizar `backend/prisma/schema.prisma` y crear migracion.
4) Agregar pruebas unitarias en el modulo nuevo.

## Postgres + Prisma Client Go

Este backend usa Prisma Client Go con Postgres.

Setup (desde `backend/`):

```bash
npm i -D prisma@5.9.1
go install github.com/steebchen/prisma-client-go@latest
PATH="$PATH:$GOPATH/bin" npx prisma generate
npx prisma migrate dev --name init
```

Correr visor Prisma (desde `backend/`):

```bash
npm run prisma:studio
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
make dev local       # backend + frontend, Postgres via Docker (usa .env.local en raiz)
make dev neon        # backend + frontend contra Neon (usa .env.neon en raiz)
make dev server      # frontend local, API remoto en Koyeb (usa .env en raiz)
```

## Postman

Importa `postman/collection.json` en Postman para probar `GET /api/hello`.

## CI (GitHub Actions)

- Ejecuta pruebas de Go y Jest
- Construye el frontend
- Corre Cypress contra `vite preview` y el backend
