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
npm run preview     # servir build en 5173
npm run test        # Jest
npm run test:e2e    # Cypress (requiere backend en :8080)
```

## Backend Go

```bash
cd backend
go run ./cmd/api     # inicia el servidor en :8080
go test ./...       # ejecuta pruebas
```

## Configuracion de Email API Privada (Gmail)

El backend envia correos usando una API privada local (`mailer-api`) con endpoint HTTP `POST /send`.
La API privada se conecta por SMTP a Gmail usando App Password.

### 1) Crear App Password en Gmail

1. Inicia sesion en tu cuenta Google.
2. Ve a Seguridad: `https://myaccount.google.com/security`.
3. Activa `Verificacion en 2 pasos`.
4. Entra a `Contrasenas de aplicaciones`: `https://myaccount.google.com/apppasswords`.
5. Selecciona app `Mail` y dispositivo `Otro` (por ejemplo: `Docker Mailer Local`).
6. Copia la clave generada de 16 caracteres.

Notas:
- No uses la contraseña normal de Gmail en SMTP.
- Si no ves `Contraseñas de aplicaciones`, normalmente falta 2FA o tu cuenta tiene una restricción administrativa.

### 2) Configurar variables en .env.local

Configura estas variables:

```bash
MAILER_API_URL=http://localhost:3000/send
MAILER_API_AUTH_KEY=dev-mailer-key
MAILER_FROM=tu_correo@gmail.com
MAILER_DEFAULT_CC=
MAILER_TIMEOUT_SECONDS=10
MAILER_SERVER_PORT=3000
MAILER_AUTHORIZATION_KEY=dev-mailer-key
MAILER_WHITELIST=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_FROM=tu_correo@gmail.com
SMTP_PASS=tu_app_password_de_16_caracteres
SMTP_SECURE=false
SMTP_CC=
```

### 3) Levantar servicios

Para flujo completo local:

```bash
make dev local
```

Ese comando inicia:
- Postgres en Docker
- API privada de correo en Docker (`http://localhost:3000/send`)
- Backend Go en `:8080`
- Frontend Vite en `:5173`

Si solo quieres levantar Docker:

```bash
docker compose up -d db mailer-api
```

Si cambias `.env.local`, recrea el contenedor del mailer:

```bash
docker compose up -d --force-recreate mailer-api
```

### 4) Verificar funcionamiento

Healthcheck:

```bash
curl http://localhost:3000/health
```

Prueba manual de envio:

```bash
curl -X POST http://localhost:3000/send \
	-H 'Authorization: dev-mailer-key' \
	-H 'Content-Type: application/json' \
	-d '{
		"from": "tu_correo@gmail.com",
		"to": "destinatario@correo.com",
		"subject": "Prueba SAGEC",
		"text": "Correo de prueba",
		"html": "<p>Correo de prueba</p>"
	}'
```

### 5) Errores comunes

- `534-5.7.9 Application-specific password required`: `SMTP_PASS` no es App Password valida.
- `550 From header sender domain not verified`: el remitente SMTP no esta permitido por tu proveedor.
- `401 Unauthorized` en `/send`: `MAILER_API_AUTH_KEY` y `MAILER_AUTHORIZATION_KEY` no coinciden.

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

Comandos Prisma (desde la raiz del proyecto):

```bash
npm run prisma:migrate:local  # usa .env.local
npm run prisma:migrate:neon   # usa .env.neon

npm run prisma:studio:local   # Prisma Studio con .env.local
npm run prisma:studio:neon    # Prisma Studio con .env.neon

npm run prisma:status:local   # estado de migraciones con .env.local
npm run prisma:status:neon    # estado de migraciones con .env.neon

npm run prisma:reset:local    # reset DB con .env.local
npm run prisma:reset:neon     # reset DB con .env.neon
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

Importa `postman/collection.json` en Postman para probar los modulos principales del API.

Cobertura actual de la colección:
- Auth (registro, login, recuperación y logout)
- Users, Roles y Permissions
- Eventos, Inscripciones, Registrations
- Notifications, Paises, Sesiones
- Trabajos cientificos (participante, revisor y comité)
- Mensajes (conversaciones, mensajes, participantes, busqueda y adjuntos)
- SMTP utilitario (`/api/smtp/send`, `/api/smtp/sandbox`)

Variable de entorno usada por Postman:

```text
base_url = http://localhost:8080
```

## Rutas API (Resumen)

Las rutas HTTP se registran en `backend/cmd/api/main.go`. Grupos principales:
- `/api/auth/*`
- `/api/users`, `/api/user/*`, `/api/roles*`, `/api/permissions*`, `/api/resources`
- `/api/eventos*`, `/api/inscripciones*`, `/api/registrations*`
- `/api/notifications*`
- `/api/paises`, `/api/ciudades`, `/api/sesiones*`
- `/api/trabajos-cientificos*`
- `/api/mensajes/*`
- `/api/smtp/*`

## CI (GitHub Actions)

- Ejecuta pruebas de Go y Jest
- Construye el frontend
- Corre Cypress contra `vite preview` y el backend
