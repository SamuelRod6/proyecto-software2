.PHONY: backend backend-test backend-run frontend-install frontend-dev frontend-build frontend-test dev local neon server

ENV_FILE ?= .env
ifneq ($(filter local,$(MAKECMDGOALS)),)
ENV_FILE = .env.local
endif
ifneq ($(filter neon,$(MAKECMDGOALS)),)
ENV_FILE = .env.neon
endif
ifneq ($(filter server,$(MAKECMDGOALS)),)
VITE_API_TARGET = https://final-clemmy-software2-7d3e7ed1.koyeb.app/api
endif
VITE_API_TARGET ?= http://localhost:8080

backend:
	cd backend && go run ./cmd/api

backend-test:
	cd backend && go test ./...

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

frontend-test:
	cd frontend && npm run test

frontend-e2e:
	cd frontend && npm run test:e2e

dev:
	@if [ "$(filter server,$(MAKECMDGOALS))" = "server" ]; then \
		echo "Starting frontend dev on :5173..."; \
		cd frontend && VITE_API_TARGET="$(VITE_API_TARGET)" npm run dev; \
	else \
		echo "Starting backend on :8080..."; \
		cd backend && ENV_FILE="$(ENV_FILE)" go run ./cmd/api & \
		BACK_PID=$$!; \
		echo "Starting frontend dev on :5173"; \
		cd frontend && VITE_API_TARGET="$(VITE_API_TARGET)" npm run dev; \
		kill $$BACK_PID || true; \
	fi

local:
	@true

neon:
	@true

server:
	@true
