-- CreateTable
CREATE TABLE "Conversacion" (
    "id_conversacion" SERIAL NOT NULL,
    "asunto" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversacion_pkey" PRIMARY KEY ("id_conversacion")
);

-- CreateTable
CREATE TABLE "ConversacionParticipante" (
    "id_conversacion" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "unido_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversacionParticipante_pkey" PRIMARY KEY ("id_conversacion","id_usuario")
);

-- CreateTable
CREATE TABLE "Mensaje" (
    "id_mensaje" SERIAL NOT NULL,
    "id_conversacion" INTEGER NOT NULL,
    "id_remitente" INTEGER NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "adjunto_url" TEXT,
    "adjunto_nombre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensaje_pkey" PRIMARY KEY ("id_mensaje")
);

-- AddForeignKey
ALTER TABLE "ConversacionParticipante" ADD CONSTRAINT "ConversacionParticipante_id_conversacion_fkey" FOREIGN KEY ("id_conversacion") REFERENCES "Conversacion"("id_conversacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversacionParticipante" ADD CONSTRAINT "ConversacionParticipante_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_id_conversacion_fkey" FOREIGN KEY ("id_conversacion") REFERENCES "Conversacion"("id_conversacion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensaje" ADD CONSTRAINT "Mensaje_id_remitente_fkey" FOREIGN KEY ("id_remitente") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
