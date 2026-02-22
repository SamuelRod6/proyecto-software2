-- CreateTable
CREATE TABLE "UsuarioRoles" (
    "id_usuario" INTEGER NOT NULL,
    "id_rol" INTEGER NOT NULL,

    CONSTRAINT "UsuarioRoles_pkey" PRIMARY KEY ("id_usuario", "id_rol")
);

-- Copy existing user roles into the join table
INSERT INTO "UsuarioRoles" ("id_usuario", "id_rol")
SELECT "id_usuario", "id_rol" FROM "Usuario" WHERE "id_rol" IS NOT NULL;

-- Drop old foreign key and column
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_id_rol_fkey";
ALTER TABLE "Usuario" DROP COLUMN "id_rol";

-- AddForeignKey
ALTER TABLE "UsuarioRoles" ADD CONSTRAINT "UsuarioRoles_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UsuarioRoles" ADD CONSTRAINT "UsuarioRoles_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "Roles"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;
