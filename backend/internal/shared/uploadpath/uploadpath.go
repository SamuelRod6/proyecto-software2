package uploadpath

import (
	"path/filepath"
	"runtime"
)

func BackendRootDir() string {
	_, currentFile, _, ok := runtime.Caller(0)
	if !ok {
		return "."
	}

	// current file: backend/internal/shared/uploadpath/uploadpath.go
	return filepath.Clean(filepath.Join(filepath.Dir(currentFile), "..", "..", "..", ".."))
}

func UploadsDir(parts ...string) string {
	segments := append([]string{BackendRootDir(), "uploads"}, parts...)
	return filepath.Join(segments...)
}
