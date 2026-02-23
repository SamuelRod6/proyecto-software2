-- Add fields to existing Inscripcion table
ALTER TABLE "Inscripcion" ADD COLUMN "nombre_participante" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Inscripcion" ADD COLUMN "email" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Inscripcion" ADD COLUMN "afiliacion" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Inscripcion" ADD COLUMN "comprobante_pago" TEXT;
ALTER TABLE "Inscripcion" ADD COLUMN "fecha_inscripcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Inscripcion" ADD COLUMN "estado" TEXT NOT NULL DEFAULT 'Pendiente';
ALTER TABLE "Inscripcion" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Inscripcion" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "InscripcionHistorial" (
    "id_historial" SERIAL NOT NULL,
    "id_inscripcion" INTEGER NOT NULL,
    "estado_anterior" TEXT NOT NULL,
    "estado_nuevo" TEXT NOT NULL,
    "nota" TEXT,
    "actor" TEXT,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InscripcionHistorial_pkey" PRIMARY KEY ("id_historial")
);

-- CreateTable
CREATE TABLE "NotificacionPreferencia" (
    "id_preferencia" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "frecuencia" TEXT NOT NULL DEFAULT 'inmediata',
    "tipos" TEXT NOT NULL DEFAULT 'estado',
    "habilitado" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificacionPreferencia_pkey" PRIMARY KEY ("id_preferencia")
);

-- CreateTable
-- Add fields to existing Notificacion table
ALTER TABLE "Notificacion" ADD COLUMN "id_inscripcion" INTEGER;
ALTER TABLE "Notificacion" ADD COLUMN "canal" TEXT NOT NULL DEFAULT 'email';
ALTER TABLE "Notificacion" ADD COLUMN "asunto" TEXT;
ALTER TABLE "Notificacion" ADD COLUMN "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Notificacion" ADD COLUMN "estado" TEXT NOT NULL DEFAULT 'enviado';
ALTER TABLE "Notificacion" ALTER COLUMN "tipo" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ReporteProgramado" (
    "id_reporte" SERIAL NOT NULL,
    "id_evento" INTEGER,
    "estado" TEXT,
    "frecuencia" TEXT NOT NULL,
    "formato" TEXT NOT NULL,
    "creado_por" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReporteProgramado_pkey" PRIMARY KEY ("id_reporte")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificacionPreferencia_id_usuario_key" ON "NotificacionPreferencia"("id_usuario");

-- AddForeignKey
ALTER TABLE "InscripcionHistorial" ADD CONSTRAINT "InscripcionHistorial_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "Inscripcion"("id_inscripcion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacionPreferencia" ADD CONSTRAINT "NotificacionPreferencia_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "Inscripcion"("id_inscripcion") ON DELETE SET NULL ON UPDATE CASCADE;
