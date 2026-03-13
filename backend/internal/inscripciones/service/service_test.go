package service

import (
	"strings"
	"testing"

	"project/backend/internal/inscripciones/repo"
)

func TestShouldSendStatusEmail(t *testing.T) {
	if shouldSendStatusEmail(repo.PreferenciaRow{Habilitado: false, Tipos: "estado"}, "Pendiente", "Aprobado") {
		t.Fatal("expected false when disabled")
	}
	if !shouldSendStatusEmail(repo.PreferenciaRow{Habilitado: true, Tipos: "estado"}, "Pendiente", "Aprobado") {
		t.Fatal("expected true for estado")
	}
	if !shouldSendStatusEmail(repo.PreferenciaRow{Habilitado: true, Tipos: "aprobado"}, "Pendiente", "Aprobado") {
		t.Fatal("expected true for aprobado transition type")
	}
	if shouldSendStatusEmail(repo.PreferenciaRow{Habilitado: true, Tipos: "aprobado"}, "Pendiente", "Rechazado") {
		t.Fatal("expected false for non-matching transition type")
	}
	if !shouldSendStatusEmail(repo.PreferenciaRow{Habilitado: true, Tipos: "rechazado,pagado"}, "Pendiente", "Pagado") {
		t.Fatal("expected true for pagado transition type")
	}
	if shouldSendStatusEmail(repo.PreferenciaRow{Habilitado: true, Tipos: "otro"}, "Pendiente", "Aprobado") {
		t.Fatal("expected false for non-estado")
	}
}

func TestBuildStatusEmail(t *testing.T) {
	subject, body := buildStatusEmail("Mauricio", "Evento X", "Pagado", "Aprobado", "21/02/2026", "Subir versión final")
	if !strings.Contains(subject, "Inscripción aprobada") || !strings.Contains(subject, "Aprobado") {
		t.Fatal("subject should include status")
	}
	if !strings.Contains(body, "Evento X") || !strings.Contains(body, "21/02/2026") {
		t.Fatal("body should include event and date")
	}
	if !strings.Contains(body, "fue aprobada") {
		t.Fatal("body should include transition-specific intro")
	}
	if !strings.Contains(body, "Estado anterior: Pagado") || !strings.Contains(body, "Nuevo estado: Aprobado") {
		t.Fatal("body should include previous and new status")
	}
	if !strings.Contains(body, "Instrucciones adicionales: Subir versión final") {
		t.Fatal("body should include additional instructions")
	}
}

func TestBuildStatusEmailWithoutInstructions(t *testing.T) {
	_, body := buildStatusEmail("Mauricio", "Evento X", "Pendiente", "Rechazado", "21/02/2026", "")
	if strings.Contains(body, "Instrucciones adicionales") {
		t.Fatal("body should not include additional instructions when empty")
	}
}

func TestStatusTransitionTemplateDefault(t *testing.T) {
	subject, body := buildStatusEmail("Mauricio", "Evento X", "Aprobado", "Rechazado", "21/02/2026", "")
	if !strings.Contains(subject, "Actualización de estado") {
		t.Fatal("subject should use default template for unmapped transition")
	}
	if !strings.Contains(body, "Se registró un cambio en el estado") {
		t.Fatal("body should use default intro for unmapped transition")
	}
}

func TestParsePreferenceTypes(t *testing.T) {
	types := parsePreferenceTypes("aprobado; rechazado|pagado estado")
	expected := []string{"aprobado", "rechazado", "pagado", "estado"}
	for _, key := range expected {
		if _, ok := types[key]; !ok {
			t.Fatalf("expected parsed types to contain %s", key)
		}
	}
}

func TestStatusTransitionTypeMapping(t *testing.T) {
	cases := []struct {
		name       string
		from       string
		to         string
		expectedTy string
	}{
		{name: "pending to paid", from: "Pendiente", to: "Pagado", expectedTy: "pagado"},
		{name: "pending to approved", from: "Pendiente", to: "Aprobado", expectedTy: "aprobado"},
		{name: "pending to rejected", from: "Pendiente", to: "Rechazado", expectedTy: "rechazado"},
		{name: "paid to approved", from: "Pagado", to: "Aprobado", expectedTy: "aprobado"},
		{name: "paid to pending", from: "Pagado", to: "Pendiente", expectedTy: "pendiente"},
		{name: "fallback", from: "Aprobado", to: "Rechazado", expectedTy: "estado"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := statusTransitionType(tc.from, tc.to); got != tc.expectedTy {
				t.Fatalf("expected %s, got %s", tc.expectedTy, got)
			}
		})
	}
}
