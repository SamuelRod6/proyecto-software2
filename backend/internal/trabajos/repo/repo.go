package repo

import (
    "context"
    "strings"

    "project/backend/prisma/db"
)

type Repository struct {
    client *db.PrismaClient
}

func New(client *db.PrismaClient) *Repository {
    return &Repository{client: client}
}

func (r *Repository) FindEventoByID(ctx context.Context, id int) (*db.EventoModel, error) {
    return r.client.Evento.FindUnique(
        db.Evento.IDEvento.Equals(id),
    ).Exec(ctx)
}

func (r *Repository) ExistsNormalizedTitleInEvent(ctx context.Context, eventID int, normalized string) (bool, error) {
    row, err := r.client.TrabajoCientifico.FindFirst(
        db.TrabajoCientifico.IDEvento.Equals(eventID),
        db.TrabajoCientifico.TituloNormalizado.Equals(strings.TrimSpace(normalized)),
    ).Exec(ctx)

    if err != nil && err.Error() != "ErrNotFound" {
        return false, err
    }

    return row != nil, nil
}

func (r *Repository) CreateTrabajo(ctx context.Context, eventID, userID int, titulo, tituloNormalizado, resumen string) (*db.TrabajoCientificoModel, error) {
    return r.client.TrabajoCientifico.CreateOne(
        db.TrabajoCientifico.Titulo.Set(strings.TrimSpace(titulo)),
        db.TrabajoCientifico.TituloNormalizado.Set(strings.TrimSpace(tituloNormalizado)),
        db.TrabajoCientifico.Resumen.Set(strings.TrimSpace(resumen)),
        db.TrabajoCientifico.Evento.Link(db.Evento.IDEvento.Equals(eventID)),
        db.TrabajoCientifico.Usuario.Link(db.Usuario.IDUsuario.Equals(userID)),
    ).Exec(ctx)
}

func (r *Repository) FindTrabajoByID(ctx context.Context, trabajoID int) (*db.TrabajoCientificoModel, error) {
    return r.client.TrabajoCientifico.FindUnique(
        db.TrabajoCientifico.IDTrabajo.Equals(trabajoID),
    ).Exec(ctx)
}

func (r *Repository) FindTrabajoByIDAndUser(ctx context.Context, trabajoID, userID int) (*db.TrabajoCientificoModel, error) {
    return r.client.TrabajoCientifico.FindFirst(
        db.TrabajoCientifico.IDTrabajo.Equals(trabajoID),
        db.TrabajoCientifico.IDUsuario.Equals(userID),
    ).Exec(ctx)
}

func (r *Repository) ListTrabajosByUser(ctx context.Context, userID int) ([]db.TrabajoCientificoModel, error) {
    return r.client.TrabajoCientifico.FindMany(
        db.TrabajoCientifico.IDUsuario.Equals(userID),
    ).OrderBy(
        db.TrabajoCientifico.UpdatedAt.Order(db.SortOrderDesc),
    ).Exec(ctx)
}

func (r *Repository) MarkVersionsAsNotCurrent(ctx context.Context, trabajoID int) error {
    rows, err := r.client.TrabajoCientificoVersion.FindMany(
        db.TrabajoCientificoVersion.IDTrabajo.Equals(trabajoID),
        db.TrabajoCientificoVersion.EsActual.Equals(true),
    ).Exec(ctx)
    if err != nil {
        return err
    }

    for _, row := range rows {
        _, err = r.client.TrabajoCientificoVersion.FindUnique(
            db.TrabajoCientificoVersion.IDVersion.Equals(row.IDVersion),
        ).Update(
            db.TrabajoCientificoVersion.EsActual.Set(false),
        ).Exec(ctx)
        if err != nil {
            return err
        }
    }
    return nil
}

func (r *Repository) CreateVersion(
    ctx context.Context,
    trabajoID, numeroVersion int,
    nombreArchivo, rutaArchivo string,
    tamanoBytes int,
    mimeType, descripcion string,
) (*db.TrabajoCientificoVersionModel, error) {
    return r.client.TrabajoCientificoVersion.CreateOne(
        db.TrabajoCientificoVersion.NumeroVersion.Set(numeroVersion),
        db.TrabajoCientificoVersion.NombreArchivo.Set(nombreArchivo),
        db.TrabajoCientificoVersion.RutaArchivo.Set(rutaArchivo),
        db.TrabajoCientificoVersion.TamanoBytes.Set(tamanoBytes),
        db.TrabajoCientificoVersion.Trabajo.Link(db.TrabajoCientifico.IDTrabajo.Equals(trabajoID)),
        db.TrabajoCientificoVersion.MimeType.Set(mimeType),
        db.TrabajoCientificoVersion.DescripcionCambios.Set(descripcion),
        db.TrabajoCientificoVersion.EsActual.Set(true),
    ).Exec(ctx)
}

func (r *Repository) UpdateTrabajoVersionActual(ctx context.Context, trabajoID, version int) error {
    _, err := r.client.TrabajoCientifico.FindUnique(
        db.TrabajoCientifico.IDTrabajo.Equals(trabajoID),
    ).Update(
        db.TrabajoCientifico.VersionActual.Set(version),
        db.TrabajoCientifico.Estado.Set("ACTUALIZADO"),
    ).Exec(ctx)
    return err
}

func (r *Repository) ListVersionesByTrabajo(ctx context.Context, trabajoID int) ([]db.TrabajoCientificoVersionModel, error) {
    return r.client.TrabajoCientificoVersion.FindMany(
        db.TrabajoCientificoVersion.IDTrabajo.Equals(trabajoID),
    ).OrderBy(
        db.TrabajoCientificoVersion.NumeroVersion.Order(db.SortOrderDesc),
    ).Exec(ctx)
}

func (r *Repository) FindVersionByTrabajoAndNumber(ctx context.Context, trabajoID, numeroVersion int) (*db.TrabajoCientificoVersionModel, error) {
    return r.client.TrabajoCientificoVersion.FindFirst(
        db.TrabajoCientificoVersion.IDTrabajo.Equals(trabajoID),
        db.TrabajoCientificoVersion.NumeroVersion.Equals(numeroVersion),
    ).Exec(ctx)
}

func (r *Repository) FindCurrentVersion(ctx context.Context, trabajoID int) (*db.TrabajoCientificoVersionModel, error) {
    return r.client.TrabajoCientificoVersion.FindFirst(
        db.TrabajoCientificoVersion.IDTrabajo.Equals(trabajoID),
        db.TrabajoCientificoVersion.EsActual.Equals(true),
    ).Exec(ctx)
}

func (r *Repository) FindVersionByID(ctx context.Context, versionID int) (*db.TrabajoCientificoVersionModel, error) {
    return r.client.TrabajoCientificoVersion.FindUnique(
        db.TrabajoCientificoVersion.IDVersion.Equals(versionID),
    ).Exec(ctx)
}

func (r *Repository) FindCommitteeUsers(ctx context.Context) ([]db.UsuarioModel, error) {
    roleIDs := make([]int, 0, 2)

    if committeeRole, err := r.client.Roles.FindFirst(
        db.Roles.NombreRol.Equals("COMITE CIENTIFICO"),
    ).Exec(ctx); err == nil && committeeRole != nil {
        roleIDs = append(roleIDs, committeeRole.IDRol)
    }

    // if adminRole, err := r.client.Roles.FindFirst(
    //     db.Roles.NombreRol.Equals("ADMIN"),
    // ).Exec(ctx); err == nil && adminRole != nil {
    //     roleIDs = append(roleIDs, adminRole.IDRol)
    // }

    if len(roleIDs) == 0 {
        return []db.UsuarioModel{}, nil
    }

    rows, err := r.client.UsuarioRoles.FindMany(
        db.UsuarioRoles.IDRol.In(roleIDs),
    ).With(
        db.UsuarioRoles.Usuario.Fetch(),
    ).Exec(ctx)
    if err != nil {
        return nil, err
    }

    users := make([]db.UsuarioModel, 0, len(rows))
    seen := map[int]struct{}{}
    for _, row := range rows {
        user := row.Usuario()
        if user == nil {
            continue
        }
        if _, ok := seen[user.IDUsuario]; ok {
            continue
        }
        seen[user.IDUsuario] = struct{}{}
        users = append(users, *user)
    }
    return users, nil
}