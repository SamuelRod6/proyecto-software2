-- CreateTable
CREATE TABLE "Inscripcion" (
    "id_inscripcion" SERIAL NOT NULL,
    "id_evento" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "nombre_participante" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "afiliacion" TEXT NOT NULL,
    "comprobante_pago" TEXT,
    "fecha_inscripcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inscripcion_pkey" PRIMARY KEY ("id_inscripcion")
);

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
CREATE TABLE "Notificacion" (
    "id_notificacion" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_inscripcion" INTEGER,
    "canal" TEXT NOT NULL DEFAULT 'email',
    "asunto" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'enviado',

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id_notificacion")
);

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
CREATE UNIQUE INDEX "Inscripcion_id_evento_id_usuario_key" ON "Inscripcion"("id_evento", "id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "NotificacionPreferencia_id_usuario_key" ON "NotificacionPreferencia"("id_usuario");

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "Evento"("id_evento") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscripcionHistorial" ADD CONSTRAINT "InscripcionHistorial_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "Inscripcion"("id_inscripcion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificacionPreferencia" ADD CONSTRAINT "NotificacionPreferencia_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_id_inscripcion_fkey" FOREIGN KEY ("id_inscripcion") REFERENCES "Inscripcion"("id_inscripcion") ON DELETE SET NULL ON UPDATE CASCADE;
