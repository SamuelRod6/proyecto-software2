.PHONY: backend backend-test backend-run frontend-install frontend-dev frontend-build frontend-test dev

backend:
	cd backend && go run .

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
	cd backend && go run . & \
	BACK_PID=$$!; \
	echo "Starting frontend dev on :5173"; \
	cd frontend && npm run dev; \
	kill $$BACK_PID || true
