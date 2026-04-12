package repo

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"project/backend/internal/trabajos/dto"
	"project/backend/prisma/db"
)

type Repository struct {
	client *db.PrismaClient
}

type WorkStatusHistoryRow struct {
	IDHistorial    int       `json:"id_historial"`
	IDTrabajo      int       `json:"id_trabajo"`
	EstadoAnterior string    `json:"estado_anterior"`
	EstadoNuevo    string    `json:"estado_nuevo"`
	TipoCambio     string    `json:"tipo_cambio"`
	Nota           string    `json:"nota"`
	Actor          string    `json:"actor"`
	FechaCambio    time.Time `json:"fecha_cambio"`
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

func (r *Repository) UserHasRole(ctx context.Context, userID int, roleName string) (bool, error) {
	roleName = strings.TrimSpace(roleName)
	if roleName == "" {
		return false, nil
	}

	rows, err := r.client.UsuarioRoles.FindMany(
		db.UsuarioRoles.IDUsuario.Equals(userID),
	).With(
		db.UsuarioRoles.Rol.Fetch(),
	).Exec(ctx)

	if err != nil {
		return false, err
	}

	for _, row := range rows {
		role := row.Rol()

		if role == nil {
			continue
		}

		if strings.EqualFold(strings.TrimSpace(role.NombreRol), roleName) {
			return true, nil
		}
	}

	return false, nil
}

func (r *Repository) ListTrabajosComite(ctx context.Context, f dto.TrabajoComiteFilter) ([]db.TrabajoCientificoModel, error) {
	var (
		rows []db.TrabajoCientificoModel
		err  error
	)

	if f.IDEvento > 0 {
		rows, err = r.client.TrabajoCientifico.FindMany(
			db.TrabajoCientifico.IDEvento.Equals(f.IDEvento),
		).With(
			db.TrabajoCientifico.Usuario.Fetch(),
		).Exec(ctx)
	} else {
		rows, err = r.client.TrabajoCientifico.FindMany().With(
			db.TrabajoCientifico.Usuario.Fetch(),
		).Exec(ctx)
	}

	if err != nil {
		return nil, err
	}

	query := strings.ToLower(strings.TrimSpace(f.Query))
	autor := strings.ToLower(strings.TrimSpace(f.Autor))
	estado := strings.ToUpper(strings.TrimSpace(f.Estado))

	filtered := make([]db.TrabajoCientificoModel, 0, len(rows))
	for _, row := range rows {
		authorName := ""

		if u := row.Usuario(); u != nil {
			authorName = u.Nombre
		}

		if query != "" {
			titulo := strings.ToLower(row.Titulo)
			resumen := strings.ToLower(row.Resumen)
			autorLower := strings.ToLower(authorName)

			if !strings.Contains(titulo, query) && !strings.Contains(resumen, query) && !strings.Contains(autorLower, query) {
				continue
			}
		}

		if autor != "" {
			if !strings.Contains(strings.ToLower(authorName), autor) {
				continue
			}
		}

		if estado != "" {
			if strings.ToUpper(strings.TrimSpace(row.Estado)) != estado {
				continue
			}
		}

		filtered = append(filtered, row)
	}

	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].UpdatedAt.After(filtered[j].UpdatedAt)
	})

	return filtered, nil
}

func (r *Repository) ListRevisores(ctx context.Context) ([]db.UsuarioModel, error) {
	role, err := r.client.Roles.FindFirst(
		db.Roles.NombreRol.Equals("REVISOR"),
	).Exec(ctx)

	if err != nil {
		if db.IsErrNotFound(err) {
			return []db.UsuarioModel{}, nil
		}

		return nil, err
	}

	rows, err := r.client.UsuarioRoles.FindMany(
		db.UsuarioRoles.IDRol.Equals(role.IDRol),
	).With(
		db.UsuarioRoles.Usuario.Fetch(),
	).Exec(ctx)

	if err != nil {
		return nil, err
	}

	revisores := make([]db.UsuarioModel, 0, len(rows))
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
		revisores = append(revisores, *user)

	}

	return revisores, nil
}

func (r *Repository) AssignReviewer(ctx context.Context, trabajoID, revisorID, asignadorID int) error {
	existing, err := r.client.TrabajoRevisionAsignacion.FindFirst(
		db.TrabajoRevisionAsignacion.IDTrabajo.Equals(trabajoID),
		db.TrabajoRevisionAsignacion.IDRevisor.Equals(revisorID),
	).Exec(ctx)

	if err != nil && !db.IsErrNotFound(err) {
		return err
	}

	if existing != nil {
		return nil
	}

	_, err = r.client.TrabajoRevisionAsignacion.CreateOne(
		db.TrabajoRevisionAsignacion.Trabajo.Link(
			db.TrabajoCientifico.IDTrabajo.Equals(trabajoID),
		),
		db.TrabajoRevisionAsignacion.Revisor.Link(
			db.Usuario.IDUsuario.Equals(revisorID),
		),
		db.TrabajoRevisionAsignacion.Asignador.Link(
			db.Usuario.IDUsuario.Equals(asignadorID),
		),
	).Exec(ctx)

	return err
}

func (r *Repository) ListTrabajosAsignadosRevisor(ctx context.Context, userID int) ([]db.TrabajoCientificoModel, error) {
	asignaciones, err := r.client.TrabajoRevisionAsignacion.FindMany(
		db.TrabajoRevisionAsignacion.IDRevisor.Equals(userID),
	).OrderBy(
		db.TrabajoRevisionAsignacion.CreatedAt.Order(db.SortOrderDesc),
	).Exec(ctx)

	if err != nil {
		return nil, err
	}

	if len(asignaciones) == 0 {
		return []db.TrabajoCientificoModel{}, nil
	}

	works := make([]db.TrabajoCientificoModel, 0, len(asignaciones))
	seen := map[int]struct{}{}

	for _, asg := range asignaciones {
		if _, ok := seen[asg.IDTrabajo]; ok {
			continue
		}
		seen[asg.IDTrabajo] = struct{}{}

		trabajo, findErr := r.client.TrabajoCientifico.FindUnique(
			db.TrabajoCientifico.IDTrabajo.Equals(asg.IDTrabajo),
		).Exec(ctx)

		if findErr != nil {
			if db.IsErrNotFound(findErr) {
				continue
			}

			return nil, findErr
		}

		if trabajo != nil {
			works = append(works, *trabajo)
		}
	}

	sort.Slice(works, func(i, j int) bool {
		return works[i].UpdatedAt.After(works[j].UpdatedAt)
	})

	return works, nil
}

func (r *Repository) UpsertEvaluacion(ctx context.Context, req dto.SubmitEvaluationRequest) error {
	recomendacion := strings.ToUpper(strings.TrimSpace(req.Recomendacion))
	if recomendacion == "" {
		recomendacion = "PENDIENTE"
	}

	comentarios := strings.TrimSpace(req.Comentarios)

	existing, err := r.client.TrabajoEvaluacion.FindFirst(
		db.TrabajoEvaluacion.IDTrabajo.Equals(req.IDTrabajo),
		db.TrabajoEvaluacion.IDRevisor.Equals(req.UserID),
	).Exec(ctx)

	if err != nil && !db.IsErrNotFound(err) {
		return err
	}

	if existing == nil {
		createParams := []db.TrabajoEvaluacionSetParam{
			db.TrabajoEvaluacion.Recomendacion.Set(recomendacion),
		}

		if req.Puntaje != nil {
			createParams = append(createParams, db.TrabajoEvaluacion.Puntaje.Set(*req.Puntaje))
		}

		_, err = r.client.TrabajoEvaluacion.CreateOne(
			db.TrabajoEvaluacion.Comentarios.Set(comentarios),
			db.TrabajoEvaluacion.Trabajo.Link(
				db.TrabajoCientifico.IDTrabajo.Equals(req.IDTrabajo),
			),
			db.TrabajoEvaluacion.Revisor.Link(
				db.Usuario.IDUsuario.Equals(req.UserID),
			),
			createParams...,
		).Exec(ctx)
		return err
	}

	updateParams := []db.TrabajoEvaluacionSetParam{
		db.TrabajoEvaluacion.Recomendacion.Set(recomendacion),
		db.TrabajoEvaluacion.Comentarios.Set(comentarios),
	}

	if req.Puntaje != nil {
		updateParams = append(updateParams, db.TrabajoEvaluacion.Puntaje.Set(*req.Puntaje))
	}

	_, err = r.client.TrabajoEvaluacion.FindUnique(
		db.TrabajoEvaluacion.IDEvaluacion.Equals(existing.IDEvaluacion),
	).Update(updateParams...).Exec(ctx)

	return err
}

func (r *Repository) ListEvaluacionesByTrabajo(ctx context.Context, trabajoID int) ([]db.TrabajoEvaluacionModel, error) {
	return r.client.TrabajoEvaluacion.FindMany(
		db.TrabajoEvaluacion.IDTrabajo.Equals(trabajoID),
	).OrderBy(
		db.TrabajoEvaluacion.UpdatedAt.Order(db.SortOrderDesc),
	).Exec(ctx)
}

func (r *Repository) UpdateDecisionComite(ctx context.Context, req dto.DecisionRequest) error {
	decision := strings.ToUpper(strings.TrimSpace(req.DecisionComite))
	if decision == "" {
		decision = "PENDIENTE REVISION"
	}

	comentario := strings.TrimSpace(req.ComentarioComite)
	now := time.Now().UTC()

	_, err := r.client.TrabajoCientifico.FindUnique(
		db.TrabajoCientifico.IDTrabajo.Equals(req.IDTrabajo),
	).Update(
		db.TrabajoCientifico.DecisionComite.Set(decision),
		db.TrabajoCientifico.ComentarioComite.Set(comentario),
		db.TrabajoCientifico.FechaDecision.Set(now),
	).Exec(ctx)

	return err
}

func (r *Repository) InsertTrabajoHistorial(ctx context.Context, trabajoID int, anterior, nuevo, tipoCambio, nota, actor string) error {
	query := `INSERT INTO "TrabajoCientificoHistorial" ("id_trabajo", "estado_anterior", "estado_nuevo", "tipo_cambio", "nota", "actor", "fecha_cambio")
		VALUES ($1, $2, $3, $4, NULLIF($5, ''), NULLIF($6, ''), NOW())`
	_, err := r.client.Prisma.Raw.ExecuteRaw(query, trabajoID, strings.TrimSpace(anterior), strings.TrimSpace(nuevo), strings.TrimSpace(tipoCambio), strings.TrimSpace(nota), strings.TrimSpace(actor)).Exec(ctx)
	return err
}

func (r *Repository) ListTrabajoHistorial(ctx context.Context, filters map[string]interface{}) ([]WorkStatusHistoryRow, error) {
	query := `SELECT "id_historial", "id_trabajo", "estado_anterior", "estado_nuevo", "tipo_cambio", COALESCE("nota", '') AS "nota", COALESCE("actor", '') AS "actor", "fecha_cambio"
		FROM "TrabajoCientificoHistorial"
		WHERE 1=1`

	params := make([]interface{}, 0)
	addCond := func(format string, value interface{}) {
		params = append(params, value)
		query += fmt.Sprintf(format, len(params))
	}

	if value, ok := filters["id_trabajo"].(int); ok && value > 0 {
		addCond(" AND \"id_trabajo\" = $%d", value)
	}
	if value, ok := filters["estado"].(string); ok && strings.TrimSpace(value) != "" {
		normalized := strings.TrimSpace(value)
		params = append(params, normalized)
		idx := len(params)
		query += fmt.Sprintf(" AND (\"estado_anterior\" = $%d OR \"estado_nuevo\" = $%d)", idx, idx)
	}
	if value, ok := filters["tipo_cambio"].(string); ok && strings.TrimSpace(value) != "" {
		addCond(" AND \"tipo_cambio\" = $%d", strings.TrimSpace(value))
	}
	if value, ok := filters["q"].(string); ok && strings.TrimSpace(value) != "" {
		term := "%" + strings.TrimSpace(value) + "%"
		params = append(params, term)
		idx := len(params)
		query += fmt.Sprintf(" AND (\"estado_anterior\" ILIKE $%d OR \"estado_nuevo\" ILIKE $%d OR COALESCE(\"nota\", '') ILIKE $%d OR COALESCE(\"actor\", '') ILIKE $%d)", idx, idx, idx, idx)
	}
	if value, ok := filters["desde"].(time.Time); ok && !value.IsZero() {
		addCond(" AND \"fecha_cambio\" >= $%d", value)
	}
	if value, ok := filters["hasta"].(time.Time); ok && !value.IsZero() {
		addCond(" AND \"fecha_cambio\" <= $%d", value)
	}

	query += ` ORDER BY "fecha_cambio" DESC, "id_historial" DESC`

	var rows []WorkStatusHistoryRow
	if err := r.client.Prisma.Raw.QueryRaw(query, params...).Exec(ctx, &rows); err != nil {
		return nil, err
	}

	return rows, nil
}

func (r *Repository) FindUserByID(ctx context.Context, userID int) (*db.UsuarioModel, error) {
	return r.client.Usuario.FindUnique(
		db.Usuario.IDUsuario.Equals(userID),
	).Exec(ctx)
}

func (r *Repository) FindAuthorAffiliation(ctx context.Context, eventID, userID int) (string, error) {
	row, err := r.client.Inscripcion.FindFirst(
		db.Inscripcion.IDEvento.Equals(eventID),
		db.Inscripcion.IDUsuario.Equals(userID),
	).Exec(ctx)

	if err != nil {
		if db.IsErrNotFound(err) {
			return "", nil
		}
		return "", err
	}

	if row == nil {
		return "", nil
	}

	return strings.TrimSpace(row.Afiliacion), nil
}

func (r *Repository) IsReviewerAssigned(ctx context.Context, trabajoID, reviewerID int) (bool, error) {
	row, err := r.client.TrabajoRevisionAsignacion.FindFirst(
		db.TrabajoRevisionAsignacion.IDTrabajo.Equals(trabajoID),
		db.TrabajoRevisionAsignacion.IDRevisor.Equals(reviewerID),
	).Exec(ctx)

	if err != nil {
		if db.IsErrNotFound(err) {
			return false, nil
		}
		return false, err
	}

	return row != nil, nil
}
