package service

import (
"context"
"errors"
"fmt"
"net/http"
"os"
"path/filepath"
"time"

notificationdto "project/backend/internal/notifications/dto"
notificationsrepo "project/backend/internal/notifications/repo"
notificationsrv "project/backend/internal/notifications/service"
"project/backend/internal/trabajos/dto"
"project/backend/internal/trabajos/repo"
"project/backend/internal/trabajos/validation"
"project/backend/prisma/db"
)

type Service struct {
repo                *repo.Repository
notificationService notificationsrv.NotificationService
}

var (
ErrTrabajoDuplicado = errors.New("Ya existe un trabajo con ese título dentro del evento")
ErrEventoNoValido  = errors.New("El evento no existe")
ErrTrabajoNoExiste = errors.New("El trabajo científico no existe")
ErrSinAcceso       = errors.New("No tiene acceso a este trabajo científico")
)

var venezuelaLocation = time.FixedZone("VET", -4*60*60)

func New(client *db.PrismaClient) *Service {
workRepo := repo.New(client)
notificationRepo := notificationsrepo.NewNotificationRepository(client)
notificationService := notificationsrv.NewNotificationService(notificationRepo)

return &Service{
repo:                workRepo,
notificationService: notificationService,
}
}

func formatDateTimeVE(t time.Time) string {
return t.UTC().In(venezuelaLocation).Format("02/01/2006 15:04")
}

func nullableDescripcion(value db.TrabajoCientificoVersionModel) string {
if v, ok := value.DescripcionCambios(); ok {
return v
}
return ""
}

func (s *Service) CreateTrabajo(ctx context.Context, req dto.CreateTrabajoRequest, file dto.UploadedFile) (*dto.TrabajoResponse, error) {
if err := validation.ValidateTitulo(req.Titulo); err != nil {
return nil, err
}
if err := validation.ValidateResumen(req.Resumen, req.DeclaraNoConfidencial); err != nil {
return nil, err
}
if err := validation.ValidatePDFContent(file.ContentType, file.Size); err != nil {
return nil, err
}

evento, err := s.repo.FindEventoByID(ctx, req.IDEvento)
if err != nil || evento == nil {
return nil, ErrEventoNoValido
}

normalized := validation.NormalizeTitle(req.Titulo)
exists, err := s.repo.ExistsNormalizedTitleInEvent(ctx, req.IDEvento, normalized)
if err != nil {
return nil, err
}
if exists {
return nil, ErrTrabajoDuplicado
}

trabajo, err := s.repo.CreateTrabajo(ctx, req.IDEvento, req.IDUsuario, req.Titulo, normalized, req.Resumen)
if err != nil {
return nil, err
}

storedPath, err := savePDF(trabajo.IDTrabajo, req.IDEvento, req.IDUsuario, 1, file)
if err != nil {
return nil, err
}

version, err := s.repo.CreateVersion(
ctx,
trabajo.IDTrabajo,
1,
file.FileName,
storedPath,
int(file.Size),
file.ContentType,
req.DescripcionCambios,
)
if err != nil {
return nil, err
}

if err := s.repo.UpdateTrabajoVersionActual(ctx, trabajo.IDTrabajo, 1); err != nil {
return nil, err
}

_, _ = s.notificationService.CreateNotification(ctx, notificationdto.CreateNotificationRequest{
UserID:  req.IDUsuario,
EventID: &req.IDEvento,
Type:    "Trabajo Recibido",
Message: fmt.Sprintf("Tu trabajo científico '%s' fue recibido correctamente.", trabajo.Titulo),
})

committeeUsers, _ := s.repo.FindCommitteeUsers(ctx)
for _, user := range committeeUsers {
_, _ = s.notificationService.CreateNotification(ctx, notificationdto.CreateNotificationRequest{
UserID:  user.IDUsuario,
EventID: &req.IDEvento,
Type:    "Trabajo Nuevo",
Message: fmt.Sprintf("Se recibió un nuevo trabajo científico: '%s'.", trabajo.Titulo),
})
}

return &dto.TrabajoResponse{
IDTrabajo:        trabajo.IDTrabajo,
IDEvento:         trabajo.IDEvento,
IDUsuario:        trabajo.IDUsuario,
Titulo:           trabajo.Titulo,
Resumen:          trabajo.Resumen,
VersionActual:    trabajo.VersionActual,
Estado:           trabajo.Estado,
FechaUltimoEnvio: formatDateTimeVE(version.FechaEnvio),
ArchivoActual: &dto.VersionResponse{
IDVersion:          version.IDVersion,
IDTrabajo:          version.IDTrabajo,
NumeroVersion:      version.NumeroVersion,
NombreArchivo:      version.NombreArchivo,
TamanoBytes:        version.TamanoBytes,
MimeType:           version.MimeType,
DescripcionCambios: nullableDescripcion(*version),
EsActual:           version.EsActual,
FechaEnvio:         formatDateTimeVE(version.FechaEnvio),
},
}, nil
}

func (s *Service) ListTrabajosByUser(ctx context.Context, userID int) ([]dto.TrabajoResponse, error) {
rows, err := s.repo.ListTrabajosByUser(ctx, userID)
if err != nil {
return nil, err
}

out := make([]dto.TrabajoResponse, 0, len(rows))
for _, row := range rows {
current, _ := s.repo.FindCurrentVersion(ctx, row.IDTrabajo)
item := dto.TrabajoResponse{
IDTrabajo:     row.IDTrabajo,
IDEvento:      row.IDEvento,
IDUsuario:     row.IDUsuario,
Titulo:        row.Titulo,
Resumen:       row.Resumen,
VersionActual: row.VersionActual,
Estado:        row.Estado,
}
if current != nil {
item.FechaUltimoEnvio = formatDateTimeVE(current.FechaEnvio)
item.ArchivoActual = &dto.VersionResponse{
IDVersion:          current.IDVersion,
IDTrabajo:          current.IDTrabajo,
NumeroVersion:      current.NumeroVersion,
NombreArchivo:      current.NombreArchivo,
TamanoBytes:        current.TamanoBytes,
MimeType:           current.MimeType,
DescripcionCambios: nullableDescripcion(*current),
EsActual:           current.EsActual,
FechaEnvio:         formatDateTimeVE(current.FechaEnvio),
}
}
out = append(out, item)
}
return out, nil
}

func (s *Service) AddVersion(ctx context.Context, req dto.AddVersionRequest, file dto.UploadedFile) (*dto.VersionResponse, error) {
if err := validation.ValidateDescripcionCambios(req.DescripcionCambios); err != nil {
return nil, err
}
if err := validation.ValidatePDFContent(file.ContentType, file.Size); err != nil {
return nil, err
}

trabajo, err := s.repo.FindTrabajoByIDAndUser(ctx, req.IDTrabajo, req.IDUsuario)
if err != nil || trabajo == nil {
return nil, ErrSinAcceso
}

evento, err := s.repo.FindEventoByID(ctx, trabajo.IDEvento)
if err != nil || evento == nil {
return nil, ErrEventoNoValido
}

nextVersion := trabajo.VersionActual + 1
if err := s.repo.MarkVersionsAsNotCurrent(ctx, trabajo.IDTrabajo); err != nil {
return nil, err
}

storedPath, err := savePDF(trabajo.IDTrabajo, trabajo.IDEvento, trabajo.IDUsuario, nextVersion, file)
if err != nil {
return nil, err
}

version, err := s.repo.CreateVersion(
ctx,
trabajo.IDTrabajo,
nextVersion,
file.FileName,
storedPath,
int(file.Size),
file.ContentType,
req.DescripcionCambios,
)
if err != nil {
return nil, err
}

if err := s.repo.UpdateTrabajoVersionActual(ctx, trabajo.IDTrabajo, nextVersion); err != nil {
return nil, err
}

committeeUsers, _ := s.repo.FindCommitteeUsers(ctx)
for _, user := range committeeUsers {
_, _ = s.notificationService.CreateNotification(ctx, notificationdto.CreateNotificationRequest{
UserID:  user.IDUsuario,
EventID: &trabajo.IDEvento,
Type:    "Trabajo Actualizado",
Message: fmt.Sprintf("El trabajo '%s' fue actualizado a la versión %d.", trabajo.Titulo, nextVersion),
})
}

return &dto.VersionResponse{
IDVersion:          version.IDVersion,
IDTrabajo:          version.IDTrabajo,
NumeroVersion:      version.NumeroVersion,
NombreArchivo:      version.NombreArchivo,
TamanoBytes:        version.TamanoBytes,
MimeType:           version.MimeType,
DescripcionCambios: nullableDescripcion(*version),
EsActual:           version.EsActual,
FechaEnvio:         formatDateTimeVE(version.FechaEnvio),
}, nil
}

func (s *Service) ListVersiones(ctx context.Context, trabajoID, userID int) ([]dto.VersionResponse, error) {
trabajo, err := s.repo.FindTrabajoByIDAndUser(ctx, trabajoID, userID)
if err != nil || trabajo == nil {
return nil, ErrSinAcceso
}

rows, err := s.repo.ListVersionesByTrabajo(ctx, trabajoID)
if err != nil {
return nil, err
}

out := make([]dto.VersionResponse, 0, len(rows))
for _, row := range rows {
out = append(out, dto.VersionResponse{
IDVersion:          row.IDVersion,
IDTrabajo:          row.IDTrabajo,
NumeroVersion:      row.NumeroVersion,
NombreArchivo:      row.NombreArchivo,
TamanoBytes:        row.TamanoBytes,
MimeType:           row.MimeType,
DescripcionCambios: nullableDescripcion(row),
EsActual:           row.EsActual,
FechaEnvio:         formatDateTimeVE(row.FechaEnvio),
})
}
return out, nil
}

func (s *Service) CompareVersiones(ctx context.Context, trabajoID, userID, from, to int) (*dto.CompareVersionsResponse, error) {
trabajo, err := s.repo.FindTrabajoByIDAndUser(ctx, trabajoID, userID)
if err != nil || trabajo == nil {
return nil, ErrSinAcceso
}

fromVersion, err := s.repo.FindVersionByTrabajoAndNumber(ctx, trabajoID, from)
if err != nil || fromVersion == nil {
return nil, ErrTrabajoNoExiste
}
toVersion, err := s.repo.FindVersionByTrabajoAndNumber(ctx, trabajoID, to)
if err != nil || toVersion == nil {
return nil, ErrTrabajoNoExiste
}

resumen := []string{
fmt.Sprintf("Versión origen: %d", fromVersion.NumeroVersion),
fmt.Sprintf("Versión destino: %d", toVersion.NumeroVersion),
fmt.Sprintf("Archivo origen: %s", fromVersion.NombreArchivo),
fmt.Sprintf("Archivo destino: %s", toVersion.NombreArchivo),
fmt.Sprintf("Tamaño origen: %d bytes", fromVersion.TamanoBytes),
fmt.Sprintf("Tamaño destino: %d bytes", toVersion.TamanoBytes),
fmt.Sprintf("Cambio reportado en destino: %s", nullableDescripcion(*toVersion)),
}

return &dto.CompareVersionsResponse{
IDTrabajo: trabajo.IDTrabajo,
From: dto.VersionResponse{
IDVersion:          fromVersion.IDVersion,
IDTrabajo:          fromVersion.IDTrabajo,
NumeroVersion:      fromVersion.NumeroVersion,
NombreArchivo:      fromVersion.NombreArchivo,
TamanoBytes:        fromVersion.TamanoBytes,
MimeType:           fromVersion.MimeType,
DescripcionCambios: nullableDescripcion(*fromVersion),
EsActual:           fromVersion.EsActual,
FechaEnvio:         formatDateTimeVE(fromVersion.FechaEnvio),
},
To: dto.VersionResponse{
IDVersion:          toVersion.IDVersion,
IDTrabajo:          toVersion.IDTrabajo,
NumeroVersion:      toVersion.NumeroVersion,
NombreArchivo:      toVersion.NombreArchivo,
TamanoBytes:        toVersion.TamanoBytes,
MimeType:           toVersion.MimeType,
DescripcionCambios: nullableDescripcion(*toVersion),
EsActual:           toVersion.EsActual,
FechaEnvio:         formatDateTimeVE(toVersion.FechaEnvio),
},
Resumen: resumen,
}, nil
}

func (s *Service) GetVersionFile(ctx context.Context, versionID, userID int) (*db.TrabajoCientificoVersionModel, error) {
version, err := s.repo.FindVersionByID(ctx, versionID)
if err != nil || version == nil {
return nil, ErrTrabajoNoExiste
}

trabajo, err := s.repo.FindTrabajoByIDAndUser(ctx, version.IDTrabajo, userID)
if err != nil || trabajo == nil {
return nil, ErrSinAcceso
}

return version, nil
}

func savePDF(trabajoID, eventID, userID, version int, file dto.UploadedFile) (string, error) {
baseDir := filepath.Join("..", "uploads", "trabajos-cientificos", fmt.Sprintf("evento_%d", eventID), fmt.Sprintf("usuario_%d", userID), fmt.Sprintf("trabajo_%d", trabajoID))
if err := os.MkdirAll(baseDir, 0o755); err != nil {
return "", err
}
fullPath := filepath.Join(baseDir, fmt.Sprintf("v%d.pdf", version))
if err := os.WriteFile(fullPath, file.Bytes, 0o644); err != nil {
return "", err
}
return fullPath, nil
}

func DetectPDFContentType(content []byte) string {
sample := content
if len(sample) > 512 {
sample = sample[:512]
}
return http.DetectContentType(sample)
}
