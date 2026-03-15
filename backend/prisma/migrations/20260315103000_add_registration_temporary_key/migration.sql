-- Reconcile runtime-created table with Prisma migration history without resetting the DB.
CREATE TABLE IF NOT EXISTS "RegistrationTemporaryKey" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "token_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "used_at" TIMESTAMPTZ NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "registration_temporary_key_email_idx"
  ON "RegistrationTemporaryKey" ("email");

CREATE INDEX IF NOT EXISTS "registration_temporary_key_token_hash_idx"
  ON "RegistrationTemporaryKey" ("token_hash");
