import React from "react";
import { useAuth } from "../../contexts/Auth/Authcontext";
import EventsAdminListScreen from "./EventsAdminListScreen";
import EventsParticipantListScreen from "./EventsParticipantListScreen";

const EventsScreenRouter: React.FC = () => {
    const { user } = useAuth();
    const roles =
      user?.roles?.map((role) =>
        typeof role === "string" ? role : role.name,
      ) ?? (user?.role ? [user.role] : []);

    if (roles.includes("ADMIN") || roles.includes("COMITE CIENTIFICO")) {
      return <EventsAdminListScreen />;
    }

    if (roles.includes("PARTICIPANTE")) {
      return <EventsParticipantListScreen />;
    }

    return null;
};

export default EventsScreenRouter;
