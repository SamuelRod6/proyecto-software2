-- CreateTable
CREATE TABLE "TrabajoCientificoHistorial" (
    "id_historial" SERIAL NOT NULL,
    "id_trabajo" INTEGER NOT NULL,
    "estado_anterior" TEXT NOT NULL,
    "estado_nuevo" TEXT NOT NULL,
    "tipo_cambio" TEXT NOT NULL DEFAULT 'DECISION COMITE',
    "nota" TEXT,
    "actor" TEXT,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrabajoCientificoHistorial_pkey" PRIMARY KEY ("id_historial")
);

-- CreateIndex
CREATE INDEX "TrabajoCientificoHistorial_id_trabajo_fecha_cambio_idx" ON "TrabajoCientificoHistorial"("id_trabajo", "fecha_cambio");

-- AddForeignKey
ALTER TABLE "TrabajoCientificoHistorial" ADD CONSTRAINT "TrabajoCientificoHistorial_id_trabajo_fkey" FOREIGN KEY ("id_trabajo") REFERENCES "TrabajoCientifico"("id_trabajo") ON DELETE RESTRICT ON UPDATE CASCADE;