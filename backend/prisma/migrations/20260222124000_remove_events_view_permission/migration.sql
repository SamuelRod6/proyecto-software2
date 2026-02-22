-- Remove events view permission and role links
DELETE FROM "RolePermisos"
WHERE "id_permiso" IN (
    SELECT "id_permiso"
    FROM "Permisos"
    WHERE "nombre_permiso" = 'Eventos::events.view'
    OR "nombre_permiso" = 'events.view'
    OR "nombre_permiso" LIKE '%::events.view'
);

DELETE FROM "Permisos"
WHERE "nombre_permiso" = 'Eventos::events.view'
OR "nombre_permiso" = 'events.view'
OR "nombre_permiso" LIKE '%::events.view';
