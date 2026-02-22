-- Add events inscription permission
INSERT INTO "Permisos" ("nombre_permiso")
VALUES ('Inscripcion a eventos::events.inscription')
ON CONFLICT ("nombre_permiso") DO NOTHING;

-- Assign permission to admin role
INSERT INTO "RolePermisos" ("id_rol", "id_permiso")
SELECT r."id_rol", p."id_permiso"
FROM "Roles" r
JOIN "Permisos" p ON p."nombre_permiso" = 'Inscripcion a eventos::events.inscription'
WHERE r."nombre_rol" = 'ADMIN'
ON CONFLICT ("id_rol", "id_permiso") DO NOTHING;

-- Assign permission to participant role
INSERT INTO "RolePermisos" ("id_rol", "id_permiso")
SELECT r."id_rol", p."id_permiso"
FROM "Roles" r
JOIN "Permisos" p ON p."nombre_permiso" = 'Inscripcion a eventos::events.inscription'
WHERE r."nombre_rol" = 'PARTICIPANTE'
ON CONFLICT ("id_rol", "id_permiso") DO NOTHING;
