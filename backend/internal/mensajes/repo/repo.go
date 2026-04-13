package repo

import (
	"context"
	"fmt"
	"strings"
	"time"

	"project/backend/internal/mensajes/dto"
	"project/backend/prisma/db"
)

type MensajesRepository interface {
	CreateConversacion(ctx context.Context, asunto string, participanteIDs []int) (int, error)
	FindConversacionByID(ctx context.Context, id int) (*ConversacionRow, error)
	ListConversacionesByUsuario(ctx context.Context, idUsuario int) ([]ConversacionRow, error)
	CreateMensaje(ctx context.Context, req dto.SendMensajeRequest) (*MensajeRow, error)
	ListMensajesByConversacion(ctx context.Context, idConversacion int) ([]MensajeRow, error)
	SearchUsuarios(ctx context.Context, q string) ([]UsuarioRow, error)
	FindUsuarioByID(ctx context.Context, id int) (*UsuarioRow, error)
	FindParticipantesByConversacion(ctx context.Context, idConversacion int) ([]ParticipanteIDRow, error)
	AddParticipante(ctx context.Context, idConversacion, idUsuario int) error
	RemoveParticipante(ctx context.Context, idConversacion, idUsuario int) error
}

// Row types used for raw SQL scanning

type ConversacionRow struct {
	IDConversacion int       `json:"id_conversacion"`
	Asunto         string    `json:"asunto"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type ParticipanteRow struct {
	IDUsuario int    `json:"id_usuario"`
	Nombre    string `json:"nombre"`
	Email     string `json:"email"`
}

type ParticipanteIDRow struct {
	IDUsuario int `json:"id_usuario"`
}

type MensajeRow struct {
	IDMensaje       int       `json:"id_mensaje"`
	IDConversacion  int       `json:"id_conversacion"`
	IDRemitente     int       `json:"id_remitente"`
	NombreRemitente string    `json:"nombre_remitente"`
	Cuerpo          string    `json:"cuerpo"`
	AdjuntoURL      *string   `json:"adjunto_url"`
	AdjuntoNombre   *string   `json:"adjunto_nombre"`
	CreatedAt       time.Time `json:"created_at"`
}

type UsuarioRow struct {
	IDUsuario int    `json:"id_usuario"`
	Nombre    string `json:"nombre"`
	Email     string `json:"email"`
}

type mensajesRepository struct {
	client *db.PrismaClient
}

func New(client *db.PrismaClient) MensajesRepository {
	return &mensajesRepository{client: client}
}

func (r *mensajesRepository) CreateConversacion(ctx context.Context, asunto string, participanteIDs []int) (int, error) {
	query := `INSERT INTO "Conversacion" ("asunto", "createdAt", "updatedAt") VALUES ($1, NOW(), NOW()) RETURNING "id_conversacion"`
	var rows []struct {
		ID int `json:"id_conversacion"`
	}
	if err := r.client.Prisma.Raw.QueryRaw(query, asunto).Exec(ctx, &rows); err != nil {
		return 0, err
	}
	if len(rows) == 0 {
		return 0, fmt.Errorf("no rows returned after conversacion insert")
	}
	convID := rows[0].ID

	for _, uid := range participanteIDs {
		q := `INSERT INTO "ConversacionParticipante" ("id_conversacion", "id_usuario", "unido_en") VALUES ($1, $2, NOW())`
		if _, err := r.client.Prisma.Raw.ExecuteRaw(q, convID, uid).Exec(ctx); err != nil {
			return 0, err
		}
	}
	return convID, nil
}

func (r *mensajesRepository) FindConversacionByID(ctx context.Context, id int) (*ConversacionRow, error) {
	query := `SELECT "id_conversacion", "asunto", "updatedAt" AS updated_at FROM "Conversacion" WHERE "id_conversacion" = $1`
	var rows []struct {
		ID        int       `json:"id_conversacion"`
		Asunto    string    `json:"asunto"`
		UpdatedAt time.Time `json:"updated_at"`
	}
	if err := r.client.Prisma.Raw.QueryRaw(query, id).Exec(ctx, &rows); err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, fmt.Errorf("conversacion not found")
	}
	return &ConversacionRow{IDConversacion: rows[0].ID, Asunto: rows[0].Asunto, UpdatedAt: rows[0].UpdatedAt}, nil
}

func (r *mensajesRepository) ListConversacionesByUsuario(ctx context.Context, idUsuario int) ([]ConversacionRow, error) {
	query := `SELECT c."id_conversacion", c."asunto", c."updatedAt" AS updated_at
		FROM "Conversacion" c
		INNER JOIN "ConversacionParticipante" cp ON cp."id_conversacion" = c."id_conversacion"
		WHERE cp."id_usuario" = $1
		ORDER BY c."updatedAt" DESC`
	var rows []struct {
		IDConversacion int       `json:"id_conversacion"`
		Asunto         string    `json:"asunto"`
		UpdatedAt      time.Time `json:"updated_at"`
	}
	if err := r.client.Prisma.Raw.QueryRaw(query, idUsuario).Exec(ctx, &rows); err != nil {
		return nil, err
	}
	result := make([]ConversacionRow, 0, len(rows))
	for _, row := range rows {
		result = append(result, ConversacionRow{IDConversacion: row.IDConversacion, Asunto: row.Asunto, UpdatedAt: row.UpdatedAt})
	}
	return result, nil
}

func (r *mensajesRepository) CreateMensaje(ctx context.Context, req dto.SendMensajeRequest) (*MensajeRow, error) {
	query := `INSERT INTO "Mensaje" ("id_conversacion", "id_remitente", "cuerpo", "adjunto_url", "adjunto_nombre", "createdAt")
		VALUES ($1, $2, $3, NULLIF($4,''), NULLIF($5,''), NOW())
		RETURNING "id_mensaje", "id_conversacion", "id_remitente", "cuerpo", "adjunto_url", "adjunto_nombre", "createdAt"`
	var rows []struct {
		IDMensaje      int       `json:"id_mensaje"`
		IDConversacion int       `json:"id_conversacion"`
		IDRemitente    int       `json:"id_remitente"`
		Cuerpo         string    `json:"cuerpo"`
		AdjuntoURL     *string   `json:"adjunto_url"`
		AdjuntoNombre  *string   `json:"adjunto_nombre"`
		CreatedAt      time.Time `json:"createdAt"`
	}
	if err := r.client.Prisma.Raw.QueryRaw(query,
		req.IDConversacion, req.IDRemitente, req.Cuerpo, req.AdjuntoURL, req.AdjuntoNombre,
	).Exec(ctx, &rows); err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, fmt.Errorf("no rows returned after mensaje insert")
	}
	row := rows[0]

	// Update conversacion updatedAt
	_, _ = r.client.Prisma.Raw.ExecuteRaw(`UPDATE "Conversacion" SET "updatedAt" = NOW() WHERE "id_conversacion" = $1`, req.IDConversacion).Exec(ctx)

	// Fetch remitente name
	nombre := r.fetchNombre(ctx, row.IDRemitente)

	return &MensajeRow{
		IDMensaje:       row.IDMensaje,
		IDConversacion:  row.IDConversacion,
		IDRemitente:     row.IDRemitente,
		NombreRemitente: nombre,
		Cuerpo:          row.Cuerpo,
		AdjuntoURL:      row.AdjuntoURL,
		AdjuntoNombre:   row.AdjuntoNombre,
		CreatedAt:       row.CreatedAt,
	}, nil
}

func (r *mensajesRepository) ListMensajesByConversacion(ctx context.Context, idConversacion int) ([]MensajeRow, error) {
	query := `SELECT m."id_mensaje", m."id_conversacion", m."id_remitente",
		u."nombre" AS nombre_remitente, m."cuerpo", m."adjunto_url", m."adjunto_nombre", m."createdAt"
		FROM "Mensaje" m
		INNER JOIN "Usuario" u ON u."id_usuario" = m."id_remitente"
		WHERE m."id_conversacion" = $1
		ORDER BY m."createdAt" ASC`
	var rows []struct {
		IDMensaje       int       `json:"id_mensaje"`
		IDConversacion  int       `json:"id_conversacion"`
		IDRemitente     int       `json:"id_remitente"`
		NombreRemitente string    `json:"nombre_remitente"`
		Cuerpo          string    `json:"cuerpo"`
		AdjuntoURL      *string   `json:"adjunto_url"`
		AdjuntoNombre   *string   `json:"adjunto_nombre"`
		CreatedAt       time.Time `json:"createdAt"`
	}
	if err := r.client.Prisma.Raw.QueryRaw(query, idConversacion).Exec(ctx, &rows); err != nil {
		return nil, err
	}
	result := make([]MensajeRow, 0, len(rows))
	for _, row := range rows {
		result = append(result, MensajeRow{
			IDMensaje:       row.IDMensaje,
			IDConversacion:  row.IDConversacion,
			IDRemitente:     row.IDRemitente,
			NombreRemitente: row.NombreRemitente,
			Cuerpo:          row.Cuerpo,
			AdjuntoURL:      row.AdjuntoURL,
			AdjuntoNombre:   row.AdjuntoNombre,
			CreatedAt:       row.CreatedAt,
		})
	}
	return result, nil
}

func (r *mensajesRepository) SearchUsuarios(ctx context.Context, q string) ([]UsuarioRow, error) {
	query := `SELECT "id_usuario", "nombre", "email" FROM "Usuario"
		WHERE LOWER("nombre") LIKE $1 OR LOWER("email") LIKE $1
		ORDER BY "nombre" LIMIT 20`
	pattern := "%" + strings.ToLower(q) + "%"
	var rows []struct {
		IDUsuario int    `json:"id_usuario"`
		Nombre    string `json:"nombre"`
		Email     string `json:"email"`
	}
	if err := r.client.Prisma.Raw.QueryRaw(query, pattern).Exec(ctx, &rows); err != nil {
		return nil, err
	}
	result := make([]UsuarioRow, 0, len(rows))
	for _, row := range rows {
		result = append(result, UsuarioRow{IDUsuario: row.IDUsuario, Nombre: row.Nombre, Email: row.Email})
	}
	return result, nil
}

func (r *mensajesRepository) FindUsuarioByID(ctx context.Context, id int) (*UsuarioRow, error) {
	query := `SELECT "id_usuario", "nombre", "email" FROM "Usuario" WHERE "id_usuario" = $1`
	var rows []struct {
		IDUsuario int    `json:"id_usuario"`
		Nombre    string `json:"nombre"`
		Email     string `json:"email"`
	}
	if err := r.client.Prisma.Raw.QueryRaw(query, id).Exec(ctx, &rows); err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, fmt.Errorf("usuario not found")
	}
	return &UsuarioRow{IDUsuario: rows[0].IDUsuario, Nombre: rows[0].Nombre, Email: rows[0].Email}, nil
}

func (r *mensajesRepository) FindParticipantesByConversacion(ctx context.Context, idConversacion int) ([]ParticipanteIDRow, error) {
	query := `SELECT "id_usuario" FROM "ConversacionParticipante" WHERE "id_conversacion" = $1`
	var rows []struct {
		IDUsuario int `json:"id_usuario"`
	}
	if err := r.client.Prisma.Raw.QueryRaw(query, idConversacion).Exec(ctx, &rows); err != nil {
		return nil, err
	}
	result := make([]ParticipanteIDRow, 0, len(rows))
	for _, row := range rows {
		result = append(result, ParticipanteIDRow{IDUsuario: row.IDUsuario})
	}
	return result, nil
}

func (r *mensajesRepository) AddParticipante(ctx context.Context, idConversacion, idUsuario int) error {
	q := `INSERT INTO "ConversacionParticipante" ("id_conversacion", "id_usuario", "unido_en") VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`
	_, err := r.client.Prisma.Raw.ExecuteRaw(q, idConversacion, idUsuario).Exec(ctx)
	return err
}

func (r *mensajesRepository) RemoveParticipante(ctx context.Context, idConversacion, idUsuario int) error {
	q := `DELETE FROM "ConversacionParticipante" WHERE "id_conversacion" = $1 AND "id_usuario" = $2`
	_, err := r.client.Prisma.Raw.ExecuteRaw(q, idConversacion, idUsuario).Exec(ctx)
	return err
}

func (r *mensajesRepository) fetchNombre(ctx context.Context, idUsuario int) string {
	u, err := r.FindUsuarioByID(ctx, idUsuario)
	if err != nil || u == nil {
		return "Usuario"
	}
	return u.Nombre
}
