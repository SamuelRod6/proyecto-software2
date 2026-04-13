package service

import (
	"strings"
	"testing"
)

func TestBuildDecisionStatusEmail(t *testing.T) {
	subject, body := buildDecisionStatusEmail(
		"Trabajo de Investigación A",
		"PENDIENTE_REVISION",
		"ACEPTADO",
		"09/04/2026 11:45",
		"Excelente enfoque metodológico",
	)

	if !strings.Contains(subject, "Actualización de estado") {
		t.Fatal("subject should describe status update")
	}
	if !strings.Contains(body, "Estado anterior: PENDIENTE_REVISION") {
		t.Fatal("body should include previous status")
	}
	if !strings.Contains(body, "Nuevo estado: ACEPTADO") {
		t.Fatal("body should include new status")
	}
	if !strings.Contains(body, "Fecha de actualización: 09/04/2026 11:45") {
		t.Fatal("body should include update date")
	}
}
