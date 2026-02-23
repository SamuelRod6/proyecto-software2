package service

import (
	"strings"
	"testing"

	"project/backend/internal/inscripciones/repo"
)

func TestShouldSendStatusEmail(t *testing.T) {
	if shouldSendStatusEmail(repo.PreferenciaRow{Habilitado: false, Tipos: "estado"}) {
		t.Fatal("expected false when disabled")
	}
	if !shouldSendStatusEmail(repo.PreferenciaRow{Habilitado: true, Tipos: "estado"}) {
		t.Fatal("expected true for estado")
	}
	if shouldSendStatusEmail(repo.PreferenciaRow{Habilitado: true, Tipos: "otro"}) {
		t.Fatal("expected false for non-estado")
	}
}

func TestBuildStatusEmail(t *testing.T) {
	subject, body := buildStatusEmail("Mauricio", "Evento X", "Pagado", "21/02/2026", "Revisado")
	if !strings.Contains(subject, "Pagado") {
		t.Fatal("subject should include status")
	}
	if !strings.Contains(body, "Evento X") || !strings.Contains(body, "21/02/2026") {
		t.Fatal("body should include event and date")
	}
	if !strings.Contains(body, "Detalles: Revisado") {
		t.Fatal("body should include details")
	}
}
