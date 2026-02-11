export const ROUTES = {
    home: "/",
    login: "/login",
    register: "/register",
    events: "/events",
    eventDetail: (eventId: string = ":eventId"): string => `/events/${eventId}`,
    eventCreate: "/events/new",
    roleManagement: "/roleManagement",
};
