-- CreateTable
CREATE TABLE "Permisos" (
    "id_permiso" SERIAL NOT NULL,
    "nombre_permiso" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permisos_pkey" PRIMARY KEY ("id_permiso")
);

-- CreateTable
CREATE TABLE "RolePermisos" (
    "id_rol" INTEGER NOT NULL,
    "id_permiso" INTEGER NOT NULL,

    CONSTRAINT "RolePermisos_pkey" PRIMARY KEY ("id_rol","id_permiso")
);

-- CreateIndex
CREATE UNIQUE INDEX "Permisos_nombre_permiso_key" ON "Permisos"("nombre_permiso");

-- AddForeignKey
ALTER TABLE "RolePermisos" ADD CONSTRAINT "RolePermisos_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "Roles"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermisos" ADD CONSTRAINT "RolePermisos_id_permiso_fkey" FOREIGN KEY ("id_permiso") REFERENCES "Permisos"("id_permiso") ON DELETE RESTRICT ON UPDATE CASCADE;
