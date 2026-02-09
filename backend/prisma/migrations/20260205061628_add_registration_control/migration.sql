-- CreateTable
CREATE TABLE "Evento" (
    "id_evento" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "fecha_cierre_inscripcion" TIMESTAMP(3) NOT NULL,
    "inscripciones_abiertas_manual" BOOLEAN NOT NULL DEFAULT true,
    "ubicacion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id_evento")
);

-- CreateIndex
CREATE UNIQUE INDEX "Evento_nombre_key" ON "Evento"("nombre");
