-- CreateTable
CREATE TABLE "Sesion" (
    "id_sesion" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sesion_pkey" PRIMARY KEY ("id_sesion")
);

-- CreateTable
CREATE TABLE "SesionPonente" (
    "id_sesion_ponente" SERIAL NOT NULL,
    "id_sesion" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "SesionPonente_pkey" PRIMARY KEY ("id_sesion_ponente")
);

-- CreateIndex
CREATE UNIQUE INDEX "SesionPonente_id_sesion_id_usuario_key" ON "SesionPonente"("id_sesion", "id_usuario");

-- AddForeignKey
ALTER TABLE "Sesion" ADD CONSTRAINT "Sesion_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "Evento"("id_evento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionPonente" ADD CONSTRAINT "SesionPonente_id_sesion_fkey" FOREIGN KEY ("id_sesion") REFERENCES "Sesion"("id_sesion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesionPonente" ADD CONSTRAINT "SesionPonente_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
