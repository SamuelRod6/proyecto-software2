.PHONY: backend backend-test backend-run frontend-install frontend-dev frontend-build frontend-test dev local neon server

ROOT_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
FRONTEND_ENV_FILE ?= $(ROOT_DIR).env
BACKEND_ENV_FILE ?= $(ROOT_DIR).env.local
ifneq ($(filter local,$(MAKECMDGOALS)),)
FRONTEND_ENV_FILE = $(ROOT_DIR).env.local
BACKEND_ENV_FILE = $(ROOT_DIR).env.local
endif
ifneq ($(filter neon,$(MAKECMDGOALS)),)
FRONTEND_ENV_FILE = $(ROOT_DIR).env.neon
BACKEND_ENV_FILE = $(ROOT_DIR).env.neon
endif

backend:
	cd backend && ENV_FILE="$(BACKEND_ENV_FILE)" go run ./cmd/api

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
	@set -a; \
	. "$(FRONTEND_ENV_FILE)"; \
	set +a; \
	if [ "$(filter local,$(MAKECMDGOALS))" = "local" ]; then \
		echo "Starting Postgres in Docker..."; \
		cd "$(ROOT_DIR)" && docker compose up -d db; \
	fi; \
	if [ "$(filter local neon,$(MAKECMDGOALS))" != "" ]; then \
		echo "Starting backend on :8080..."; \
		cd backend && ENV_FILE="$(BACKEND_ENV_FILE)" go run ./cmd/api & \
		BACK_PID=$$!; \
		echo "Starting frontend dev on :5173..."; \
		cd frontend && VITE_API_TARGET="$$VITE_API_TARGET" npm run dev; \
		kill $$BACK_PID || true; \
	else \
		echo "Starting frontend dev on :5173..."; \
		cd frontend && VITE_API_TARGET="$$VITE_API_TARGET" npm run dev; \
	fi

local:
	@true

neon:
	@true

server:
	@true
