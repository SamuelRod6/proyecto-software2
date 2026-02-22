export const RESOURCE_KEYS = {
  CREATE_EVENT: "events.create",
  ROLE_MANAGEMENT: "roles.manage",
  PERMISSION_MANAGEMENT: "permissions.manage",
} as const;

export type ResourceDefinition = {
    key: string;
    label: string;
    description: string;
};

export const RESOURCE_DEFINITIONS: ResourceDefinition[] = [
  {
    key: RESOURCE_KEYS.CREATE_EVENT,
    label: "Crear evento",
    description: "Permite crear eventos en la aplicacion.",
  },
  {
    key: RESOURCE_KEYS.ROLE_MANAGEMENT,
    label: "Gestion de roles",
    description: "Permite administrar roles y sus permisos.",
  },
  {
    key: RESOURCE_KEYS.PERMISSION_MANAGEMENT,
    label: "Gestion de permisos y recursos",
    description: "Permite administrar permisos y asignarlos a recursos.",
  },
];
