.PHONY: backend backend-test backend-run frontend-install frontend-dev frontend-build frontend-test dev local server

ENV_FILE ?= .env
ifneq ($(filter local,$(MAKECMDGOALS)),)
ENV_FILE = .env.local
endif
ifneq ($(filter server,$(MAKECMDGOALS)),)
ENV_FILE = .env
endif

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
	@echo "Starting backend on :8080..."
	cd backend && ENV_FILE="$(ENV_FILE)" go run ./cmd/api & \
	BACK_PID=$$!; \
	echo "Starting frontend dev on :5173"; \
	cd frontend && npm run dev; \
	kill $$BACK_PID || true

local:
	@true

server:
	@true
