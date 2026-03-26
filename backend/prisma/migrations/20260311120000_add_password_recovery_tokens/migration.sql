-- CreateTable
CREATE TABLE "PasswordRecoveryToken" (
    "id" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordRecoveryToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasswordRecoveryToken_id_usuario_idx" ON "PasswordRecoveryToken"("id_usuario");

-- CreateIndex
CREATE INDEX "PasswordRecoveryToken_token_hash_idx" ON "PasswordRecoveryToken"("token_hash");

-- AddForeignKey
ALTER TABLE "PasswordRecoveryToken" ADD CONSTRAINT "PasswordRecoveryToken_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
