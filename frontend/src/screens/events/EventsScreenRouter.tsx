import React from "react";
import { useAuth } from "../../contexts/Auth/Authcontext";
import EventsAdminListScreen from "./EventsAdminListScreen";
import EventsParticipantListScreen from "./EventsParticipantListScreen";

const EventsScreenRouter: React.FC = () => {
    const { user } = useAuth();
    const role = user?.role || user?.rol || "";

    if (role === "ADMIN" || role === "COMITE CIENTIFICO") {
        return <EventsAdminListScreen />;
    }

    if (role === "PARTICIPANTE") {
        return <EventsParticipantListScreen />;
    }

};

export default EventsScreenRouter;
