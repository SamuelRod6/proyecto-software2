export const RESOURCE_KEYS = {
    CREATE_EVENT: "events.create",
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
];
