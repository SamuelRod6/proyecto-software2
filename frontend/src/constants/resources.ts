export const RESOURCE_KEYS = {
  EVENTS_MANAGEMENT: "events.management",
  EVENTS_INSCRIPTION: "events.inscription",
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
    key: RESOURCE_KEYS.EVENTS_INSCRIPTION,
    label: "Inscripción a eventos",
    description: "Permite inscribirse a eventos disponibles.",
  },
  {
    key: RESOURCE_KEYS.EVENTS_MANAGEMENT,
    label: "Gestión de eventos",
    description: "Permite crear y modificar eventos.",
  },
  {
    key: RESOURCE_KEYS.ROLE_MANAGEMENT,
    label: "Gestión de roles",
    description: "Permite administrar roles y sus permisos.",
  },
  {
    key: RESOURCE_KEYS.PERMISSION_MANAGEMENT,
    label: "Gestión de permisos y recursos",
    description: "Permite administrar permisos y asignarlos a recursos.",
  },
];
