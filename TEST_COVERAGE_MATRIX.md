# Test Coverage Matrix

Last update: 2026-04-12

## Current Metrics
- Backend Go test files: 17
- Frontend Jest test files: 35
- Frontend Cypress specs: 7

## Newly Covered In This Iteration

### Backend
- Unit: `backend/internal/auth/validation/validation_test.go`
- Unit: `backend/internal/trabajos/validation/validation_test.go`
- Unit: `backend/internal/registrations/validation/validation_test.go`
- Unit: `backend/internal/inscripciones/validation/validation_test.go`
- Unit/HTTP helpers: `backend/internal/shared/response/response_test.go`
- Unit/HTTP helpers: `backend/internal/shared/httperror/httperror_test.go`
- Unit/path helpers: `backend/internal/shared/uploadpath/uploadpath_test.go`
- Unit/role permission helpers: `backend/internal/roles/service/service_test.go`

### Frontend
- Unit/Integration (routing): `frontend/src/navigation/ProtectedRoute.test.tsx`
- Unit/Integration (routing): `frontend/src/navigation/ResourceRoute.test.tsx`
- Unit (route wrapper): `frontend/src/navigation/AdminRoute.test.tsx`
- Unit (screen): `frontend/src/screens/HomeScreen.test.tsx`
- Integration (screen flow): `frontend/src/screens/scientificWorks/ScientificWorksScreen.test.tsx`
- E2E (scientific works history): `frontend/cypress/e2e/dPruebaHistorialTrabajosCientificos.cy.js`
- E2E (protected route): `frontend/cypress/e2e/ePruebaRutaProtegida.cy.js`

## Validation Commands Executed
- `go test ./internal/auth/validation ./internal/trabajos/validation ./internal/registrations/validation ./internal/inscripciones/validation ./internal/shared/response ./internal/shared/httperror ./internal/shared/uploadpath ./internal/roles/service`
- `npm run test -- --runInBand src/navigation/ProtectedRoute.test.tsx src/navigation/ResourceRoute.test.tsx src/navigation/AdminRoute.test.tsx src/screens/HomeScreen.test.tsx`
- `npm run test:e2e -- --spec cypress/e2e/dPruebaHistorialTrabajosCientificos.cy.js`
- `npm run test:e2e -- --spec cypress/e2e/ePruebaRutaProtegida.cy.js`

## Remaining Backlog Snapshot

### Backend high-priority modules still without direct tests
- `backend/internal/events/service/service.go`
- `backend/internal/events/repo/repo.go`
- `backend/internal/auth/service/service.go`
- `backend/internal/auth/service/recovery.go`
- `backend/internal/sesiones/service/service.go`
- `backend/internal/sesiones/handler/handler.go`
- `backend/internal/notifications/service/service.go`
- `backend/internal/notifications/handler/handler.go`
- `backend/internal/trabajos/handler/handler.go`
- `backend/internal/trabajos/repo/repo.go`

### Frontend high-priority modules still without direct tests
- `frontend/src/navigation/AppRouter.tsx`
- `frontend/src/layouts/AppLayout.tsx`
- `frontend/src/contexts/Auth/Authcontext.tsx`
- `frontend/src/components/events/EventDetailModal.tsx`
- `frontend/src/components/notifications/NotificationButton.tsx`
- `frontend/src/screens/events/EventsAdminListScreen.tsx`
- `frontend/src/screens/events/EventsParticipantListScreen.tsx`
- `frontend/src/screens/scientificWorks/ScientificWorksManagementScreen.tsx`
- `frontend/src/screens/auth/LoginScreen.tsx`
- `frontend/src/screens/auth/RegisterScreen.tsx`

## Suggested Closure Order
1. Backend handlers/services with repo mocks (events, sesiones, trabajos, notifications, auth).
2. Frontend contexts and router integration tests (AppRouter + AuthContext + AppLayout).
3. Frontend critical screens not yet covered (events admin/participant, login/register, scientific works management).
4. E2E smoke for role/resource gating paths and scientific works management flow.
