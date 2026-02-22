package repo

import (
	"context"
	"fmt"
	"strings"
	"time"

	"project/backend/prisma/db"
)

type Repository struct {
	client *db.PrismaClient
}

func New(client *db.PrismaClient) *Repository {
	return &Repository{client: client}
}

type InscripcionRow struct {
	IDInscripcion    int     `json:"id_inscripcion"`
	IDEvento         int     `json:"id_evento"`
	EventoNombre     string  `json:"evento_nombre"`
	IDUsuario        int     `json:"id_usuario"`
	Nombre           string  `json:"nombre_participante"`
	Email            string  `json:"email"`
	Afiliacion       string  `json:"afiliacion"`
	ComprobantePago  *string `json:"comprobante_pago"`
	FechaInscripcion string  `json:"fecha_inscripcion"`
	FechaLimitePago  string  `json:"fecha_limite_pago"`
	Estado           string  `json:"estado"`
}

type HistorialRow struct {
	IDHistorial    int    `json:"id_historial"`
	IDInscripcion  int    `json:"id_inscripcion"`
	EstadoAnterior string `json:"estado_anterior"`
	EstadoNuevo    string `json:"estado_nuevo"`
	Nota           string `json:"nota"`
	Actor          string `json:"actor"`
	FechaCambio    string `json:"fecha_cambio"`
}

type PreferenciaRow struct {
	IDUsuario  int    `json:"id_usuario"`
	Frecuencia string `json:"frecuencia"`
	Tipos      string `json:"tipos"`
	Habilitado bool   `json:"habilitado"`
}

type NotificacionRow struct {
	IDNotificacion int     `json:"id_notificacion"`
	IDUsuario      int     `json:"id_usuario"`
	IDInscripcion  *int    `json:"id_inscripcion"`
	Canal          string  `json:"canal"`
	Asunto         string  `json:"asunto"`
	Mensaje        string  `json:"mensaje"`
	FechaEnvio     string  `json:"fecha_envio"`
	Estado         string  `json:"estado"`
}

type ReporteProgramadoRow struct {
	IDReporte  int     `json:"id_reporte"`
	IDEvento   *int    `json:"id_evento"`
	Estado     *string `json:"estado"`
	Frecuencia string  `json:"frecuencia"`
	Formato    string  `json:"formato"`
	CreadoPor  *string `json:"creado_por"`
	CreadoEn   string  `json:"creado_en"`
}

func (r *Repository) FindEventoByID(ctx context.Context, id int) (*db.EventoModel, error) {
	return r.client.Evento.FindUnique(db.Evento.IDEvento.Equals(id)).Exec(ctx)
}

func (r *Repository) FindUsuarioByID(ctx context.Context, id int) (*db.UsuarioModel, error) {
	return r.client.Usuario.FindUnique(db.Usuario.IDUsuario.Equals(id)).Exec(ctx)
}

func (r *Repository) CreateInscripcion(ctx context.Context, eventoID, usuarioID int, nombre, email, afiliacion, comprobante, estado string) (int, error) {
	query := `INSERT INTO "Inscripcion" ("id_evento", "id_usuario", "nombre_participante", "email", "afiliacion", "comprobante_pago", "fecha_inscripcion", "estado", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, NULLIF($6, ''), NOW(), $7, NOW(), NOW())
		RETURNING "id_inscripcion"`
	var rows []struct {
		ID int `json:"id_inscripcion"`
	}
	if err := r.client.Prisma.Raw.QueryRaw(query, eventoID, usuarioID, strings.TrimSpace(nombre), strings.TrimSpace(email), strings.TrimSpace(afiliacion), strings.TrimSpace(comprobante), estado).Exec(ctx, &rows); err != nil {
		return 0, err
	}
	if len(rows) == 0 {
		return 0, fmt.Errorf("no rows")
	}
	return rows[0].ID, nil
}

func (r *Repository) FindInscripcionByEventoUsuario(ctx context.Context, eventoID, usuarioID int) (int, error) {
	query := `SELECT "id_inscripcion" FROM "Inscripcion" WHERE "id_evento" = $1 AND "id_usuario" = $2 LIMIT 1`
	var rows []struct {
		ID int `json:"id_inscripcion"`
	}
	if err := r.client.Prisma.Raw.QueryRaw(query, eventoID, usuarioID).Exec(ctx, &rows); err != nil {
		return 0, err
	}
	if len(rows) == 0 {
		return 0, db.ErrNotFound
	}
	return rows[0].ID, nil
}

func (r *Repository) ListInscripciones(ctx context.Context, filters map[string]interface{}) ([]InscripcionRow, error) {
	query := `SELECT i."id_inscripcion", i."id_evento", e."nombre" AS "evento_nombre", i."id_usuario", i."nombre_participante", i."email", i."afiliacion", i."comprobante_pago",
		to_char(i."fecha_inscripcion", 'DD/MM/YYYY') AS "fecha_inscripcion",
		to_char(e."fecha_cierre_inscripcion", 'DD/MM/YYYY') AS "fecha_limite_pago",
		i."estado"
		FROM "Inscripcion" i
		JOIN "Evento" e ON e."id_evento" = i."id_evento"
		WHERE 1=1`

	params := make([]interface{}, 0)
	addCond := func(format string, value interface{}) {
		params = append(params, value)
		query += fmt.Sprintf(format, len(params))
	}

	if value, ok := filters["id_usuario"].(int); ok && value > 0 {
		addCond(" AND i.\"id_usuario\" = $%d", value)
	}
	if value, ok := filters["id_inscripcion"].(int); ok && value > 0 {
		addCond(" AND i.\"id_inscripcion\" = $%d", value)
	}
	if value, ok := filters["id_evento"].(int); ok && value > 0 {
		addCond(" AND i.\"id_evento\" = $%d", value)
	}
	if value, ok := filters["estado"].(string); ok && strings.TrimSpace(value) != "" {
		addCond(" AND i.\"estado\" = $%d", strings.TrimSpace(value))
	}
	if value, ok := filters["q"].(string); ok && strings.TrimSpace(value) != "" {
		term := "%" + strings.TrimSpace(value) + "%"
		params = append(params, term)
		idx := len(params)
		query += fmt.Sprintf(" AND (i.\"nombre_participante\" ILIKE $%d OR i.\"email\" ILIKE $%d OR e.\"nombre\" ILIKE $%d)", idx, idx, idx)
	}
	if value, ok := filters["desde"].(time.Time); ok && !value.IsZero() {
		addCond(" AND i.\"fecha_inscripcion\" >= $%d", value)
	}
	if value, ok := filters["hasta"].(time.Time); ok && !value.IsZero() {
		addCond(" AND i.\"fecha_inscripcion\" <= $%d", value)
	}

	query += " ORDER BY i.\"fecha_inscripcion\" DESC"

	var rows []InscripcionRow
	if err := r.client.Prisma.Raw.QueryRaw(query, params...).Exec(ctx, &rows); err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *Repository) UpdateEstado(ctx context.Context, inscripcionID int, estado string) error {
	query := `UPDATE "Inscripcion" SET "estado" = $1, "updatedAt" = NOW() WHERE "id_inscripcion" = $2`
	_, err := r.client.Prisma.Raw.ExecuteRaw(query, estado, inscripcionID).Exec(ctx)
	return err
}

func (r *Repository) InsertHistorial(ctx context.Context, inscripcionID int, anterior, nuevo, nota, actor string) error {
	query := `INSERT INTO "InscripcionHistorial" ("id_inscripcion", "estado_anterior", "estado_nuevo", "nota", "actor", "fecha_cambio")
		VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), NOW())`
	_, err := r.client.Prisma.Raw.ExecuteRaw(query, inscripcionID, anterior, nuevo, strings.TrimSpace(nota), strings.TrimSpace(actor)).Exec(ctx)
	return err
}

func (r *Repository) ListHistorial(ctx context.Context, inscripcionID int) ([]HistorialRow, error) {
	query := `SELECT "id_historial", "id_inscripcion", "estado_anterior", "estado_nuevo", COALESCE("nota", '') AS "nota", COALESCE("actor", '') AS "actor",
		to_char("fecha_cambio", 'DD/MM/YYYY') AS "fecha_cambio"
		FROM "InscripcionHistorial"
		WHERE "id_inscripcion" = $1
		ORDER BY "fecha_cambio" DESC`
	var rows []HistorialRow
	if err := r.client.Prisma.Raw.QueryRaw(query, inscripcionID).Exec(ctx, &rows); err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *Repository) UpsertPreferencias(ctx context.Context, usuarioID int, frecuencia, tipos string, habilitado bool) (PreferenciaRow, error) {
	query := `INSERT INTO "NotificacionPreferencia" ("id_usuario", "frecuencia", "tipos", "habilitado")
		VALUES ($1, $2, $3, $4)
		ON CONFLICT ("id_usuario") DO UPDATE SET "frecuencia" = EXCLUDED."frecuencia", "tipos" = EXCLUDED."tipos", "habilitado" = EXCLUDED."habilitado"
		RETURNING "id_usuario", "frecuencia", "tipos", "habilitado"`
	var rows []PreferenciaRow
	if err := r.client.Prisma.Raw.QueryRaw(query, usuarioID, strings.TrimSpace(frecuencia), strings.TrimSpace(tipos), habilitado).Exec(ctx, &rows); err != nil {
		return PreferenciaRow{}, err
	}
	if len(rows) == 0 {
		return PreferenciaRow{}, fmt.Errorf("no rows")
	}
	return rows[0], nil
}

func (r *Repository) GetPreferencias(ctx context.Context, usuarioID int) (*PreferenciaRow, error) {
	query := `SELECT "id_usuario", "frecuencia", "tipos", "habilitado" FROM "NotificacionPreferencia" WHERE "id_usuario" = $1 LIMIT 1`
	var rows []PreferenciaRow
	if err := r.client.Prisma.Raw.QueryRaw(query, usuarioID).Exec(ctx, &rows); err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, db.ErrNotFound
	}
	return &rows[0], nil
}

func (r *Repository) InsertNotificacion(ctx context.Context, usuarioID int, inscripcionID *int, asunto, mensaje string) error {
	query := `INSERT INTO "Notificacion" ("id_usuario", "id_inscripcion", "canal", "asunto", "mensaje", "fecha_envio", "estado")
		VALUES ($1, $2, 'email', $3, $4, NOW(), 'enviado')`
	_, err := r.client.Prisma.Raw.ExecuteRaw(query, usuarioID, inscripcionID, strings.TrimSpace(asunto), strings.TrimSpace(mensaje)).Exec(ctx)
	return err
}

func (r *Repository) ListNotificaciones(ctx context.Context, usuarioID int) ([]NotificacionRow, error) {
	query := `SELECT "id_notificacion", "id_usuario", "id_inscripcion", "canal", "asunto", "mensaje", to_char("fecha_envio", 'DD/MM/YYYY') AS "fecha_envio", "estado"
		FROM "Notificacion"
		WHERE "id_usuario" = $1
		ORDER BY "fecha_envio" DESC`
	var rows []NotificacionRow
	if err := r.client.Prisma.Raw.QueryRaw(query, usuarioID).Exec(ctx, &rows); err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *Repository) ReportePorEstado(ctx context.Context, filters map[string]interface{}) (map[string]int, int, error) {
	query := `SELECT i."estado" AS "estado", COUNT(*)::int AS "total"
		FROM "Inscripcion" i
		WHERE 1=1`
	params := make([]interface{}, 0)
	addCond := func(format string, value interface{}) {
		params = append(params, value)
		query += fmt.Sprintf(format, len(params))
	}
	if value, ok := filters["id_evento"].(int); ok && value > 0 {
		addCond(" AND i.\"id_evento\" = $%d", value)
	}
	if value, ok := filters["estado"].(string); ok && strings.TrimSpace(value) != "" {
		addCond(" AND i.\"estado\" = $%d", strings.TrimSpace(value))
	}
	if value, ok := filters["desde"].(time.Time); ok && !value.IsZero() {
		addCond(" AND i.\"fecha_inscripcion\" >= $%d", value)
	}
	if value, ok := filters["hasta"].(time.Time); ok && !value.IsZero() {
		addCond(" AND i.\"fecha_inscripcion\" <= $%d", value)
	}
	query += " GROUP BY i.\"estado\""

	var rows []struct {
		Estado string `json:"estado"`
		Total  int    `json:"total"`
	}
	if err := r.client.Prisma.Raw.QueryRaw(query, params...).Exec(ctx, &rows); err != nil {
		return nil, 0, err
	}

	result := map[string]int{}
	total := 0
	for _, row := range rows {
		result[row.Estado] = row.Total
		total += row.Total
	}
	return result, total, nil
}

func (r *Repository) CreateReporteProgramado(ctx context.Context, idEvento *int, estado, frecuencia, formato, creadoPor string) (ReporteProgramadoRow, error) {
	query := `INSERT INTO "ReporteProgramado" ("id_evento", "estado", "frecuencia", "formato", "creado_por", "creado_en")
		VALUES ($1, NULLIF($2, ''), $3, $4, NULLIF($5, ''), NOW())
		RETURNING "id_reporte", "id_evento", "estado", "frecuencia", "formato", "creado_por", to_char("creado_en", 'DD/MM/YYYY') AS "creado_en"`
	var rows []ReporteProgramadoRow
	if err := r.client.Prisma.Raw.QueryRaw(query, idEvento, strings.TrimSpace(estado), strings.TrimSpace(frecuencia), strings.TrimSpace(formato), strings.TrimSpace(creadoPor)).Exec(ctx, &rows); err != nil {
		return ReporteProgramadoRow{}, err
	}
	if len(rows) == 0 {
		return ReporteProgramadoRow{}, fmt.Errorf("no rows")
	}
	return rows[0], nil
}

func (r *Repository) ListReportesProgramados(ctx context.Context) ([]ReporteProgramadoRow, error) {
	query := `SELECT "id_reporte", "id_evento", "estado", "frecuencia", "formato", "creado_por", to_char("creado_en", 'DD/MM/YYYY') AS "creado_en"
		FROM "ReporteProgramado"
		ORDER BY "creado_en" DESC`
	var rows []ReporteProgramadoRow
	if err := r.client.Prisma.Raw.QueryRaw(query).Exec(ctx, &rows); err != nil {
		return nil, err
	}
	return rows, nil
}
