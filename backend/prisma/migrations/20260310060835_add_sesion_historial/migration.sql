-- CreateTable
CREATE TABLE "SesionHistorial" (
    "id_historial" SERIAL NOT NULL,
    "id_sesion" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "detalle" TEXT,
    "actor" TEXT,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valores_antes" TEXT,
    "valores_despues" TEXT,

    CONSTRAINT "SesionHistorial_pkey" PRIMARY KEY ("id_historial")
);

-- AddForeignKey
ALTER TABLE "SesionHistorial" ADD CONSTRAINT "SesionHistorial_id_sesion_fkey" FOREIGN KEY ("id_sesion") REFERENCES "Sesion"("id_sesion") ON DELETE RESTRICT ON UPDATE CASCADE;
