package uploadpath

import (
	"path/filepath"
	"strings"
	"testing"
)

func TestBackendRootDirNotEmpty(t *testing.T) {
	root := BackendRootDir()
	if strings.TrimSpace(root) == "" {
		t.Fatal("expected non-empty backend root dir")
	}
}

func TestUploadsDirIncludesSegments(t *testing.T) {
	path := UploadsDir("mensajes", "archivo.pdf")
	if !strings.Contains(path, filepath.Join("uploads", "mensajes", "archivo.pdf")) {
		t.Fatalf("unexpected upload path: %s", path)
	}
}
