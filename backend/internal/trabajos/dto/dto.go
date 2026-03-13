package dto

type UploadedFile struct {
	FileName    string
	ContentType string
	Size        int64
	Bytes       []byte
}

type CreateTrabajoRequest struct {
    IDEvento                int    `json:"id_evento"`
    IDUsuario               int    `json:"id_usuario"`
    Titulo                  string `json:"titulo"`
    Resumen                 string `json:"resumen"`
    DeclaraNoConfidencial   bool   `json:"declara_no_confidencial"`
    DescripcionCambios      string `json:"descripcion_cambios"`
}

type AddVersionRequest struct {
    IDTrabajo              int    `json:"id_trabajo"`
    IDUsuario              int    `json:"id_usuario"`
    DescripcionCambios     string `json:"descripcion_cambios"`
}

type TrabajoResponse struct {
    IDTrabajo         int              `json:"id_trabajo"`
    IDEvento          int              `json:"id_evento"`
    IDUsuario         int              `json:"id_usuario"`
    Titulo            string           `json:"titulo"`
    Resumen           string           `json:"resumen"`
    VersionActual     int              `json:"version_actual"`
    Estado            string           `json:"estado"`
    FechaUltimoEnvio  string           `json:"fecha_ultimo_envio"`
    ArchivoActual     *VersionResponse `json:"archivo_actual,omitempty"`
}

type VersionResponse struct {
    IDVersion            int    `json:"id_version"`
    IDTrabajo            int    `json:"id_trabajo"`
    NumeroVersion        int    `json:"numero_version"`
    NombreArchivo        string `json:"nombre_archivo"`
    TamanoBytes          int    `json:"tamano_bytes"`
    MimeType             string `json:"mime_type"`
    DescripcionCambios   string `json:"descripcion_cambios"`
    EsActual             bool   `json:"es_actual"`
    FechaEnvio           string `json:"fecha_envio"`
}

type CompareVersionsResponse struct {
    IDTrabajo int             `json:"id_trabajo"`
    From      VersionResponse `json:"from"`
    To        VersionResponse `json:"to"`
    Resumen   []string        `json:"resumen"`
}