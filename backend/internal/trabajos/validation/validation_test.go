package validation

import (
	"mime/multipart"
	"net/textproto"
	"testing"
)

func TestNormalizeTitle(t *testing.T) {
	got := NormalizeTitle("  Titulo   Con   Espacios  ")
	if got != "titulo con espacios" {
		t.Fatalf("unexpected normalized title: %q", got)
	}
}

func TestValidateTitulo(t *testing.T) {
	if err := ValidateTitulo("Titulo Cientifico Valido"); err != nil {
		t.Fatalf("expected valid title, got: %v", err)
	}
	if err := ValidateTitulo("abc"); err == nil {
		t.Fatal("expected invalid short title")
	}
	if err := ValidateTitulo("Titulo 123 Invalido"); err == nil {
		t.Fatal("expected invalid title with numbers")
	}
}

func TestValidateResumen(t *testing.T) {
	words := "uno dos tres cuatro cinco seis siete ocho nueve diez "
	resumen := ""
	for i := 0; i < 10; i++ {
		resumen += words
	}

	if err := ValidateResumen(resumen, true); err != nil {
		t.Fatalf("expected valid resumen, got: %v", err)
	}
	if err := ValidateResumen("muy corto", true); err == nil {
		t.Fatal("expected invalid resumen by word count")
	}
	if err := ValidateResumen(resumen, false); err == nil {
		t.Fatal("expected invalid resumen without declaration")
	}
}

func TestValidatePDFHeader(t *testing.T) {
	if err := ValidatePDFHeader(nil); err != ErrArchivoRequerido {
		t.Fatalf("expected ErrArchivoRequerido, got: %v", err)
	}

	h := &multipart.FileHeader{
		Filename: "trabajo.pdf",
		Size:     1024,
		Header:   textproto.MIMEHeader{"Content-Type": []string{"application/pdf"}},
	}
	if err := ValidatePDFHeader(h); err != nil {
		t.Fatalf("expected valid header, got: %v", err)
	}

	hBad := &multipart.FileHeader{
		Filename: "trabajo.txt",
		Size:     1024,
		Header:   textproto.MIMEHeader{"Content-Type": []string{"text/plain"}},
	}
	if err := ValidatePDFHeader(hBad); err != ErrArchivoInvalido {
		t.Fatalf("expected ErrArchivoInvalido, got: %v", err)
	}
}

func TestValidatePDFContent(t *testing.T) {
	if err := ValidatePDFContent("application/pdf", 1024); err != nil {
		t.Fatalf("expected valid content, got: %v", err)
	}
	if err := ValidatePDFContent("application/pdf", 0); err != ErrArchivoRequerido {
		t.Fatalf("expected ErrArchivoRequerido, got: %v", err)
	}
	if err := ValidatePDFContent("text/plain", 10); err != ErrArchivoInvalido {
		t.Fatalf("expected ErrArchivoInvalido, got: %v", err)
	}
}

func TestValidateDescripcionCambios(t *testing.T) {
	if err := ValidateDescripcionCambios("Se ajusto metodologia"); err != nil {
		t.Fatalf("expected valid description, got: %v", err)
	}
	if err := ValidateDescripcionCambios("corto"); err == nil {
		t.Fatal("expected invalid short description")
	}
}
