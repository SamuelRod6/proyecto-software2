package service

import (
	"strings"
	"testing"

	"project/backend/internal/inscripciones/repo"
)

func TestShouldSendStatusEmail(t *testing.T) {
	if shouldSendStatusEmail(repo.PreferenciaRow{Habilitado: false, Tipos: "estado"}, "En revisión", "Aceptado") {
		t.Fatal("expected false when disabled")
	}
	if !shouldSendStatusEmail(repo.PreferenciaRow{Habilitado: true, Tipos: "estado"}, "En revisión", "Aceptado") {
		t.Fatal("expected true for estado")
	}
	if !shouldSendStatusEmail(repo.PreferenciaRow{Habilitado: true, Tipos: "aceptado"}, "En revisión", "Aceptado") {
		t.Fatal("expected true for aceptado transition type")
	}
	if shouldSendStatusEmail(repo.PreferenciaRow{Habilitado: true, Tipos: "aceptado"}, "En revisión", "Rechazado") {
		t.Fatal("expected false for non-matching transition type")
	}
	if !shouldSendStatusEmail(repo.PreferenciaRow{Habilitado: true, Tipos: "rechazado,pagado"}, "Pendiente", "Pagado") {
		t.Fatal("expected true for pagado transition type")
	}
	if shouldSendStatusEmail(repo.PreferenciaRow{Habilitado: true, Tipos: "otro"}, "En revisión", "Aceptado") {
		t.Fatal("expected false for non-estado")
	}
}

func TestBuildStatusEmail(t *testing.T) {
	subject, body := buildStatusEmail("Mauricio", "Evento X", "En revisión", "Aceptado", "21/02/2026", "Subir versión final")
	if !strings.Contains(subject, "Tu trabajo fue aceptado") || !strings.Contains(subject, "Aceptado") {
		t.Fatal("subject should include status")
	}
	if !strings.Contains(body, "Evento X") || !strings.Contains(body, "21/02/2026") {
		t.Fatal("body should include event and date")
	}
	if !strings.Contains(body, "fue aceptado") {
		t.Fatal("body should include transition-specific intro")
	}
	if !strings.Contains(body, "Estado anterior: En revisión") || !strings.Contains(body, "Nuevo estado: Aceptado") {
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
	subject, body := buildStatusEmail("Mauricio", "Evento X", "Pendiente", "Aprobado", "21/02/2026", "")
	if !strings.Contains(subject, "Actualización de estado") {
		t.Fatal("subject should use default template for unmapped transition")
	}
	if !strings.Contains(body, "Se registró un cambio en el estado") {
		t.Fatal("body should use default intro for unmapped transition")
	}
}

func TestParsePreferenceTypes(t *testing.T) {
	types := parsePreferenceTypes("aceptado; rechazado|pagado estado")
	expected := []string{"aceptado", "rechazado", "pagado", "estado"}
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
		{name: "revision to accepted", from: "En revisión", to: "Aceptado", expectedTy: "aceptado"},
		{name: "revision to approved", from: "En revisión", to: "Aprobado", expectedTy: "aceptado"},
		{name: "revision to rejected", from: "En revisión", to: "Rechazado", expectedTy: "rechazado"},
		{name: "pending to paid", from: "Pendiente", to: "Pagado", expectedTy: "pagado"},
		{name: "paid to approved", from: "Pagado", to: "Aprobado", expectedTy: "aprobado"},
		{name: "fallback", from: "Pendiente", to: "Aprobado", expectedTy: "estado"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := statusTransitionType(tc.from, tc.to); got != tc.expectedTy {
				t.Fatalf("expected %s, got %s", tc.expectedTy, got)
			}
		})
	}
}
