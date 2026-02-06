/*
  Warnings:

  - Added the required column `fecha_cierre_inscripcion` to the `Evento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Evento" ADD COLUMN     "fecha_cierre_inscripcion" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "inscripciones_abiertas_manual" BOOLEAN NOT NULL DEFAULT true;
