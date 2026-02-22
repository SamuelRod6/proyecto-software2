export const ROUTES = {
    home: "/",
    login: "/login",
    register: "/register",
    events: "/events",
    eventDetail: (eventId: string = ":eventId"): string => `/events/${eventId}`,
    eventCreate: "/events/new",
    roleManagement: "/roleManagement",
    permissionManagement: "/permissionManagement",
    inscriptions: "/inscriptions",
    myInscriptions: "/inscriptions/mine",
    inscriptionsAdmin: "/inscriptions/admin",
    inscriptionsReports: "/inscriptions/reports",
};
