-- CreateTable
CREATE TABLE "TrabajoCientifico" (
    "id_trabajo" SERIAL NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "titulo_normalizado" TEXT NOT NULL,
    "resumen" TEXT NOT NULL,
    "version_actual" INTEGER NOT NULL DEFAULT 1,
    "estado" TEXT NOT NULL DEFAULT 'RECIBIDO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrabajoCientifico_pkey" PRIMARY KEY ("id_trabajo")
);

-- CreateTable
CREATE TABLE "TrabajoCientificoVersion" (
    "id_version" SERIAL NOT NULL,
    "id_trabajo" INTEGER NOT NULL,
    "numero_version" INTEGER NOT NULL,
    "nombre_archivo" TEXT NOT NULL,
    "ruta_archivo" TEXT NOT NULL,
    "tamano_bytes" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL DEFAULT 'application/pdf',
    "descripcion_cambios" TEXT,
    "es_actual" BOOLEAN NOT NULL DEFAULT true,
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrabajoCientificoVersion_pkey" PRIMARY KEY ("id_version")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrabajoCientifico_id_evento_titulo_normalizado_key" ON "TrabajoCientifico"("id_evento", "titulo_normalizado");

-- CreateIndex
CREATE UNIQUE INDEX "TrabajoCientificoVersion_id_trabajo_numero_version_key" ON "TrabajoCientificoVersion"("id_trabajo", "numero_version");

-- AddForeignKey
ALTER TABLE "TrabajoCientifico" ADD CONSTRAINT "TrabajoCientifico_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "Evento"("id_evento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrabajoCientifico" ADD CONSTRAINT "TrabajoCientifico_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrabajoCientificoVersion" ADD CONSTRAINT "TrabajoCientificoVersion_id_trabajo_fkey" FOREIGN KEY ("id_trabajo") REFERENCES "TrabajoCientifico"("id_trabajo") ON DELETE RESTRICT ON UPDATE CASCADE;
