package repo

import (
	"context"
	"time"

	"project/backend/internal/auth/domain"
	"project/backend/prisma/db"
)

type UserRepository struct {
	Client *db.PrismaClient
}

func NewUserRepository(client *db.PrismaClient) *UserRepository {
	return &UserRepository{Client: client}
}

func (r *UserRepository) CreateUser(ctx context.Context, name, email, passwordHash string, roleID int) (*db.UsuarioModel, error) {
	user, err := r.Client.Usuario.CreateOne(
		db.Usuario.Nombre.Set(name),
		db.Usuario.Email.Set(email),
		db.Usuario.PasswordHash.Set(passwordHash),
	).Exec(ctx)
	if err != nil {
		return nil, err
	}

	if roleID > 0 {
		_, err = r.Client.UsuarioRoles.CreateOne(
			db.UsuarioRoles.Usuario.Link(
				db.Usuario.IDUsuario.Equals(user.IDUsuario),
			),
			db.UsuarioRoles.Rol.Link(
				db.Roles.IDRol.Equals(roleID),
			),
		).Exec(ctx)
		if err != nil {
			return nil, err
		}
	}

	return user, nil
}

func (r *UserRepository) FindUserByEmail(ctx context.Context, email string) (*db.UsuarioModel, error) {
	return r.Client.Usuario.FindUnique(
		db.Usuario.Email.Equals(email),
	).Exec(ctx)
}

func (r *UserRepository) FindRoleByID(ctx context.Context, roleID int) (*db.RolesModel, error) {
	return r.Client.Roles.FindUnique(
		db.Roles.IDRol.Equals(roleID),
	).Exec(ctx)
}

func (r *UserRepository) FindPrimaryRoleByUserID(ctx context.Context, userID int) (*db.RolesModel, error) {
	roles, err := r.Client.UsuarioRoles.
		FindMany(db.UsuarioRoles.IDUsuario.Equals(userID)).
		With(db.UsuarioRoles.Rol.Fetch()).
		Exec(ctx)
	if err != nil {
		return nil, err
	}
	if len(roles) == 0 || roles[0].RelationsUsuarioRoles.Rol == nil {
		return nil, db.ErrNotFound
	}
	return roles[0].RelationsUsuarioRoles.Rol, nil
}

func (r *UserRepository) ListRolesByUserID(ctx context.Context, userID int) ([]db.RolesModel, error) {
	roles, err := r.Client.UsuarioRoles.
		FindMany(db.UsuarioRoles.IDUsuario.Equals(userID)).
		With(db.UsuarioRoles.Rol.Fetch()).
		Exec(ctx)
	if err != nil {
		return nil, err
	}
	if len(roles) == 0 {
		return []db.RolesModel{}, nil
	}

	roleModels := make([]db.RolesModel, 0, len(roles))
	for _, userRole := range roles {
		if userRole.RelationsUsuarioRoles.Rol != nil {
			roleModels = append(roleModels, *userRole.RelationsUsuarioRoles.Rol)
		}
	}
	if len(roleModels) == 0 {
		return []db.RolesModel{}, nil
	}
	return roleModels, nil
}

func (r *UserRepository) UpdatePassword(ctx context.Context, email, passwordHash string) (*db.UsuarioModel, error) {
	return r.Client.Usuario.FindUnique(
		db.Usuario.Email.Equals(email),
	).Update(
		db.Usuario.PasswordHash.Set(passwordHash),
	).Exec(ctx)
}

func (r *UserRepository) DeleteActivePasswordRecoveryTokens(ctx context.Context, userID int) error {
	query := `DELETE FROM "PasswordRecoveryToken" WHERE "id_usuario" = $1 AND "used_at" IS NULL`
	_, err := r.Client.Prisma.Raw.ExecuteRaw(query, userID).Exec(ctx)
	return err
}

func (r *UserRepository) CreatePasswordRecoveryToken(ctx context.Context, userID int, tokenHash string, expiresAt time.Time) error {
	query := `INSERT INTO "PasswordRecoveryToken" ("id_usuario", "token_hash", "expires_at", "created_at") VALUES ($1, $2, $3, NOW())`
	_, err := r.Client.Prisma.Raw.ExecuteRaw(query, userID, tokenHash, expiresAt).Exec(ctx)
	return err
}

func (r *UserRepository) FindValidPasswordRecoveryToken(ctx context.Context, email, tokenHash string, now time.Time) (*domain.PasswordRecoveryToken, error) {
	query := `SELECT prt."id", prt."id_usuario", u."email", prt."expires_at"
		FROM "PasswordRecoveryToken" prt
		JOIN "Usuario" u ON u."id_usuario" = prt."id_usuario"
		WHERE u."email" = $1
			AND prt."token_hash" = $2
			AND prt."used_at" IS NULL
			AND prt."expires_at" > $3
		ORDER BY prt."created_at" DESC
		LIMIT 1`

	var rows []domain.PasswordRecoveryToken
	if err := r.Client.Prisma.Raw.QueryRaw(query, email, tokenHash, now).Exec(ctx, &rows); err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, db.ErrNotFound
	}
	return &rows[0], nil
}

func (r *UserRepository) MarkPasswordRecoveryTokenUsed(ctx context.Context, tokenID int) error {
	query := `UPDATE "PasswordRecoveryToken" SET "used_at" = NOW() WHERE "id" = $1`
	_, err := r.Client.Prisma.Raw.ExecuteRaw(query, tokenID).Exec(ctx)
	return err
}

func (r *UserRepository) ensureRegistrationTemporaryKeyTable(ctx context.Context) error {
	createTableQuery := `
		CREATE TABLE IF NOT EXISTS "RegistrationTemporaryKey" (
			"id" SERIAL PRIMARY KEY,
			"name" TEXT NOT NULL,
			"email" TEXT NOT NULL,
			"token_hash" TEXT NOT NULL,
			"expires_at" TIMESTAMPTZ NOT NULL,
			"used_at" TIMESTAMPTZ NULL,
			"created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)`
	if _, err := r.Client.Prisma.Raw.ExecuteRaw(createTableQuery).Exec(ctx); err != nil {
		return err
	}

	createEmailIndexQuery := `CREATE INDEX IF NOT EXISTS "registration_temporary_key_email_idx" ON "RegistrationTemporaryKey" ("email")`
	if _, err := r.Client.Prisma.Raw.ExecuteRaw(createEmailIndexQuery).Exec(ctx); err != nil {
		return err
	}

	createTokenIndexQuery := `CREATE INDEX IF NOT EXISTS "registration_temporary_key_token_hash_idx" ON "RegistrationTemporaryKey" ("token_hash")`
	if _, err := r.Client.Prisma.Raw.ExecuteRaw(createTokenIndexQuery).Exec(ctx); err != nil {
		return err
	}

	return nil
}

func (r *UserRepository) DeleteActiveRegistrationTemporaryKeysByEmail(ctx context.Context, email string) error {
	if err := r.ensureRegistrationTemporaryKeyTable(ctx); err != nil {
		return err
	}

	query := `DELETE FROM "RegistrationTemporaryKey" WHERE "email" = $1 AND "used_at" IS NULL`
	_, err := r.Client.Prisma.Raw.ExecuteRaw(query, email).Exec(ctx)
	return err
}

func (r *UserRepository) CreateRegistrationTemporaryKey(ctx context.Context, name, email, tokenHash string, expiresAt time.Time) error {
	if err := r.ensureRegistrationTemporaryKeyTable(ctx); err != nil {
		return err
	}

	query := `INSERT INTO "RegistrationTemporaryKey" ("name", "email", "token_hash", "expires_at", "created_at") VALUES ($1, $2, $3, $4, NOW())`
	_, err := r.Client.Prisma.Raw.ExecuteRaw(query, name, email, tokenHash, expiresAt).Exec(ctx)
	return err
}

func (r *UserRepository) FindValidRegistrationTemporaryKey(ctx context.Context, email, tokenHash string, now time.Time) (*domain.RegistrationTemporaryKey, error) {
	if err := r.ensureRegistrationTemporaryKeyTable(ctx); err != nil {
		return nil, err
	}

	query := `SELECT "id", "name", "email", "expires_at" AS "expiresAt"
		FROM "RegistrationTemporaryKey"
		WHERE "email" = $1
			AND "token_hash" = $2
			AND "used_at" IS NULL
			AND "expires_at" > $3
		ORDER BY "created_at" DESC
		LIMIT 1`

	var rows []domain.RegistrationTemporaryKey
	if err := r.Client.Prisma.Raw.QueryRaw(query, email, tokenHash, now).Exec(ctx, &rows); err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, db.ErrNotFound
	}

	return &rows[0], nil
}

func (r *UserRepository) MarkRegistrationTemporaryKeyUsed(ctx context.Context, keyID int) error {
	if err := r.ensureRegistrationTemporaryKeyTable(ctx); err != nil {
		return err
	}

	query := `UPDATE "RegistrationTemporaryKey" SET "used_at" = NOW() WHERE "id" = $1`
	_, err := r.Client.Prisma.Raw.ExecuteRaw(query, keyID).Exec(ctx)
	return err
}

func (r *UserRepository) CountUsers(ctx context.Context) (int, error) {
	users, err := r.Client.Usuario.FindMany().Exec(ctx)
	if err != nil {
		return 0, err
	}
	return len(users), nil
}

func (r *UserRepository) ListUsersWithRoles(ctx context.Context, limit, offset int) ([]db.UsuarioModel, error) {
	return r.Client.Usuario.
		FindMany().
		Skip(offset).
		Take(limit).
		Select(
			db.Usuario.IDUsuario.Field(),
			db.Usuario.Nombre.Field(),
			db.Usuario.Email.Field(),
		).
		With(db.Usuario.UsuarioRoles.Fetch().With(db.UsuarioRoles.Rol.Fetch())).
		Exec(ctx)
}

func (r *UserRepository) ListRoles(ctx context.Context) ([]db.RolesModel, error) {
	return r.Client.Roles.
		FindMany().
		Select(
			db.Roles.IDRol.Field(),
			db.Roles.NombreRol.Field(),
		).
		Exec(ctx)
}
