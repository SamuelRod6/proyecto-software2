-- DropForeignKey
ALTER TABLE "PasswordRecoveryToken" DROP CONSTRAINT "PasswordRecoveryToken_id_usuario_fkey";

-- AddForeignKey
ALTER TABLE "PasswordRecoveryToken" ADD CONSTRAINT "PasswordRecoveryToken_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
