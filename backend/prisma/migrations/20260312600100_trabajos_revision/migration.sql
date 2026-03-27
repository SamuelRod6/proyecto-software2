ALTER TABLE "TrabajoCientifico"
  ADD COLUMN "decision_comite" TEXT NOT NULL DEFAULT 'PENDIENTE REVISION',
  ADD COLUMN "comentario_comite" TEXT,
  ADD COLUMN "fecha_decision" TIMESTAMP(3);

CREATE TABLE "TrabajoRevisionAsignacion" (
  "id_asignacion" SERIAL PRIMARY KEY,
  "id_trabajo" INTEGER NOT NULL,
  "id_revisor" INTEGER NOT NULL,
  "id_asignador" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrabajoRevisionAsignacion_id_trabajo_fkey"
    FOREIGN KEY ("id_trabajo") REFERENCES "TrabajoCientifico"("id_trabajo")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TrabajoRevisionAsignacion_id_revisor_fkey"
    FOREIGN KEY ("id_revisor") REFERENCES "Usuario"("id_usuario")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TrabajoRevisionAsignacion_id_asignador_fkey"
    FOREIGN KEY ("id_asignador") REFERENCES "Usuario"("id_usuario")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TrabajoRevisionAsignacion_id_trabajo_id_revisor_key"
  ON "TrabajoRevisionAsignacion"("id_trabajo", "id_revisor");

CREATE TABLE "TrabajoEvaluacion" (
  "id_evaluacion" SERIAL PRIMARY KEY,
  "id_trabajo" INTEGER NOT NULL,
  "id_revisor" INTEGER NOT NULL,
  "recomendacion" TEXT NOT NULL DEFAULT 'PENDIENTE',
  "puntaje" INTEGER,
  "comentarios" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrabajoEvaluacion_id_trabajo_fkey"
    FOREIGN KEY ("id_trabajo") REFERENCES "TrabajoCientifico"("id_trabajo")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "TrabajoEvaluacion_id_revisor_fkey"
    FOREIGN KEY ("id_revisor") REFERENCES "Usuario"("id_usuario")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TrabajoEvaluacion_id_trabajo_id_revisor_key"
  ON "TrabajoEvaluacion"("id_trabajo", "id_revisor");