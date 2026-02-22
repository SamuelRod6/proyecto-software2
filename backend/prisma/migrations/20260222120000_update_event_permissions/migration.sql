-- Add new event module permissions
INSERT INTO "Permisos" ("nombre_permiso")
VALUES ('Gestion de eventos::events.management')
ON CONFLICT ("nombre_permiso") DO NOTHING;

-- Remove old event permissions and their role links
DELETE FROM "RolePermisos"
WHERE "id_permiso" IN (
    SELECT "id_permiso"
    FROM "Permisos"
    WHERE "nombre_permiso" IN (
        'events.create',
        'events.admin.view',
        'events.participant.view'
    )
    OR "nombre_permiso" LIKE '%::events.create'
    OR "nombre_permiso" LIKE '%::events.admin.view'
    OR "nombre_permiso" LIKE '%::events.participant.view'
);

DELETE FROM "Permisos"
WHERE "nombre_permiso" IN (
    'events.create',
    'events.admin.view',
    'events.participant.view'
)
OR "nombre_permiso" LIKE '%::events.create'
OR "nombre_permiso" LIKE '%::events.admin.view'
OR "nombre_permiso" LIKE '%::events.participant.view';

-- Assign new permissions to roles if they exist
INSERT INTO "RolePermisos" ("id_rol", "id_permiso")
SELECT r."id_rol", p."id_permiso"
FROM "Roles" r
JOIN "Permisos" p ON p."nombre_permiso" = 'Gestion de eventos::events.management'
WHERE r."nombre_rol" = 'ADMIN'
ON CONFLICT ("id_rol", "id_permiso") DO NOTHING;

