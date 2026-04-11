/*
File: dto.go

Contains:
Request and response DTO definitions for the Trabajos module.
It centralizes payload structures for submissions, versions,
committee workflows, reviewer assignment, and evaluations.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

package dto

// UploadedFile represents an uploaded document payload.
type UploadedFile struct {
	FileName    string
	ContentType string
	Size        int64
	Bytes       []byte
}

// CreateTrabajoRequest represents payload to create a scientific work.
type CreateTrabajoRequest struct {
	IDEvento              int    `json:"id_evento"`
	IDUsuario             int    `json:"id_usuario"`
	Titulo                string `json:"titulo"`
	Resumen               string `json:"resumen"`
	DeclaraNoConfidencial bool   `json:"declara_no_confidencial"`
	DescripcionCambios    string `json:"descripcion_cambios"`
}

// AddVersionRequest represents payload to upload a new work version.
type AddVersionRequest struct {
	IDTrabajo          int    `json:"id_trabajo"`
	IDUsuario          int    `json:"id_usuario"`
	DescripcionCambios string `json:"descripcion_cambios"`
}

// TrabajoResponse represents one scientific work in API responses.
type TrabajoResponse struct {
	IDTrabajo        int              `json:"id_trabajo"`
	IDEvento         int              `json:"id_evento"`
	IDUsuario        int              `json:"id_usuario"`
	Titulo           string           `json:"titulo"`
	Resumen          string           `json:"resumen"`
	VersionActual    int              `json:"version_actual"`
	Estado           string           `json:"estado"`
	FechaUltimoEnvio string           `json:"fecha_ultimo_envio"`
	ArchivoActual    *VersionResponse `json:"archivo_actual,omitempty"`
}

// VersionResponse represents one uploaded work version.
type VersionResponse struct {
	IDVersion          int    `json:"id_version"`
	IDTrabajo          int    `json:"id_trabajo"`
	NumeroVersion      int    `json:"numero_version"`
	NombreArchivo      string `json:"nombre_archivo"`
	TamanoBytes        int    `json:"tamano_bytes"`
	MimeType           string `json:"mime_type"`
	DescripcionCambios string `json:"descripcion_cambios"`
	EsActual           bool   `json:"es_actual"`
	FechaEnvio         string `json:"fecha_envio"`
}

// CompareVersionsResponse represents version comparison output.
type CompareVersionsResponse struct {
	IDTrabajo int             `json:"id_trabajo"`
	From      VersionResponse `json:"from"`
	To        VersionResponse `json:"to"`
	Resumen   []string        `json:"resumen"`
}

// TrabajoComiteFilter represents filters for committee listing.
type TrabajoComiteFilter struct {
	UserID   int
	Query    string
	Autor    string
	Estado   string
	IDEvento int
}

// TrabajoComiteItem represents one work item in committee listings.
type TrabajoComiteItem struct {
	IDTrabajo                 int              `json:"id_trabajo"`
	IDEvento                  int              `json:"id_evento"`
	IDAutor                   int              `json:"id_autor"`
	Autor                     string           `json:"autor"`
	AfiliacionAutor           string           `json:"afiliacion_autor"`
	Titulo                    string           `json:"titulo"`
	Resumen                   string           `json:"resumen"`
	Estado                    string           `json:"estado"`
	DecisionComite            string           `json:"decision_comite"`
	RevisadoPreviamente       bool             `json:"revisado_previamente"`
	CantidadEvaluaciones      int              `json:"cantidad_evaluaciones"`
	CantidadEvaluacionesOtros int              `json:"cantidad_evaluaciones_otros"`
	CalificacionPromedio      *float64         `json:"calificacion_promedio,omitempty"`
	FechaUltimoEnvio          string           `json:"fecha_ultimo_envio"`
	VersionActual             int              `json:"version_actual"`
	ArchivoActual             *VersionResponse `json:"archivo_actual,omitempty"`
}

// AssignReviewersRequest represents payload to assign reviewers.
type AssignReviewersRequest struct {
	UserID    int   `json:"user_id"`
	IDTrabajo int   `json:"id_trabajo"`
	Revisores []int `json:"revisores"`
}

// ReviewerListItem represents one reviewer candidate.
type ReviewerListItem struct {
	IDUsuario int    `json:"id_usuario"`
	Nombre    string `json:"nombre"`
	Email     string `json:"email"`
}

// SubmitEvaluationRequest represents payload to submit reviewer evaluation.
type SubmitEvaluationRequest struct {
	UserID          int    `json:"user_id"`
	IDTrabajo       int    `json:"id_trabajo"`
	Recomendacion   string `json:"recomendacion"`
	Puntaje         *int   `json:"puntaje"`
	Comentarios     string `json:"comentarios"`
	Fortalezas      string `json:"fortalezas"`
	Debilidades     string `json:"debilidades"`
	Recomendaciones string `json:"recomendaciones"`
}

// EvaluationItem represents one stored evaluation entry.
type EvaluationItem struct {
	IDEvaluacion  int    `json:"id_evaluacion"`
	IDTrabajo     int    `json:"id_trabajo"`
	IDRevisor     int    `json:"id_revisor"`
	Revisor       string `json:"revisor"`
	Recomendacion string `json:"recomendacion"`
	Puntaje       *int   `json:"puntaje"`
	Comentarios   string `json:"comentarios"`
	UpdatedAt     string `json:"updated_at"`
}

// EvaluationSummary represents evaluation aggregate and detail list.
type EvaluationSummary struct {
	IDTrabajo            int              `json:"id_trabajo"`
	CantidadEvaluaciones int              `json:"cantidad_evaluaciones"`
	CalificacionPromedio *float64         `json:"calificacion_promedio,omitempty"`
	Evaluaciones         []EvaluationItem `json:"evaluaciones"`
}

// DecisionRequest represents payload for committee final decision.
type DecisionRequest struct {
	UserID           int    `json:"user_id"`
	IDTrabajo        int    `json:"id_trabajo"`
	DecisionComite   string `json:"decision_comite"`
	ComentarioComite string `json:"comentario_comite"`
}
