-- Add roles management permission
INSERT INTO "Permisos" ("nombre_permiso")
VALUES ('Gestion de roles::roles.manage')
ON CONFLICT ("nombre_permiso") DO NOTHING;

-- Assign permission to admin role
INSERT INTO "RolePermisos" ("id_rol", "id_permiso")
SELECT r."id_rol", p."id_permiso"
FROM "Roles" r
JOIN "Permisos" p ON p."nombre_permiso" = 'Gestion de roles::roles.manage'
WHERE r."nombre_rol" = 'ADMIN'
ON CONFLICT ("id_rol", "id_permiso") DO NOTHING;
