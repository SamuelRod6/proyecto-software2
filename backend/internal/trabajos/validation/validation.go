package validation

import (
	"errors"
	"mime/multipart"
	"regexp"
	"strings"
	"unicode/utf8"
)

const MaxPDFSize int64 = 10 * 1024 * 1024 // 10 MB

var (
	ErrTituloInvalido          = errors.New("El título debe tener entre 10 y 100 caracteres y solo puede contener letras y espacios")
	ErrResumenInvalido         = errors.New("El resumen debe tener entre 100 y 500 palabras")
	ErrDeclaracionConfidencial = errors.New("Debe confirmar que el resumen no contiene información confidencial o sensible")
	ErrArchivoRequerido        = errors.New("Debe adjuntar un archivo PDF")
	ErrArchivoInvalido         = errors.New("El archivo debe ser un PDF válido")
	ErrArchivoMuyGrande        = errors.New("El archivo PDF no puede superar los 10 MB")
	ErrDescripcionCambios      = errors.New("La descripción de cambios debe tener entre 10 y 300 caracteres")
)

var tituloPattern = regexp.MustCompile(`^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$`)

func NormalizeTitle(value string) string {
	clean := strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
	return strings.ToLower(clean)
}

func ValidateTitulo(value string) error {
	clean := strings.Join(strings.Fields(strings.TrimSpace(value)), " ")
	length := utf8.RuneCountInString(clean)

	if length < 10 || length > 100 {
		return ErrTituloInvalido
	}

	if !tituloPattern.MatchString(clean) {
		return ErrTituloInvalido
	}

	return nil
}

func ValidateResumen(value string, declarado bool) error {
	words := len(strings.Fields(strings.TrimSpace(value)))

	if words < 100 || words > 500 {
		return ErrResumenInvalido
	}

	if !declarado {
		return ErrDeclaracionConfidencial
	}

	return nil
}

func ValidatePDFHeader(header *multipart.FileHeader) error {
	if header == nil {
		return ErrArchivoRequerido
	}

	if header.Size > MaxPDFSize {
		return ErrArchivoMuyGrande
	}

	if !strings.EqualFold(header.Header.Get("Content-Type"), "application/pdf") &&
		!strings.HasSuffix(strings.ToLower(header.Filename), ".pdf") {
		return ErrArchivoInvalido
	}

	return nil
}

func ValidatePDFContent(contentType string, size int64) error {
	if size == 0 {
		return ErrArchivoRequerido
	}

	if size > MaxPDFSize {
		return ErrArchivoMuyGrande
	}

	if contentType != "application/pdf" {
		return ErrArchivoInvalido
	}

	return nil
}

func ValidateDescripcionCambios(value string) error {
	clean := strings.TrimSpace(value)

	if len(clean) < 10 || len(clean) > 300 {
		return ErrDescripcionCambios
	}

	return nil
}