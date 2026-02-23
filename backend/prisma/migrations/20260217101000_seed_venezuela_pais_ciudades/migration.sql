-- Insert country
INSERT INTO "Pais" ("nombre")
VALUES ('Venezuela')
ON CONFLICT ("nombre") DO NOTHING;

-- Insert cities
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Caracas', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Maracaibo', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Valencia', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Barquisimeto', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Maracay', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Ciudad Guayana', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Barcelona', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Maturín', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Puerto La Cruz', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Petare', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Turmero', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Ciudad Bolívar', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'San Cristóbal', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Mérida', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Cabimas', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Cumaná', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'San Félix', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Guarenas', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Puerto Cabello', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Acarigua', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Los Teques', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Punto Fijo', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Valera', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Guacara', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Carúpano', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Catia La Mar', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'El Tigre', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Guatire', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'La Victoria', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Ejido', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
INSERT INTO "Ciudad" ("nombre", "id_pais")
SELECT 'Cagua', "id_pais" FROM "Pais" WHERE "nombre" = 'Venezuela'
ON CONFLICT ("nombre", "id_pais") DO NOTHING;
