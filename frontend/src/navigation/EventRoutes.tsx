import { Route } from "react-router-dom";
import { RESOURCE_KEYS } from "../constants/resources";
import ResourceRoute from "./ResourceRoute";
// screens
import EventsAdminListScreen from "../screens/events/EventsAdminListScreen";
import EventsParticipantListScreen from "../screens/events/EventsParticipantListScreen";

export const eventRoutes = (
  <>
    <Route path="events" element={<EventsParticipantListScreen />} />
    <Route
      path="events-management"
      element={
        <ResourceRoute resourceKey={RESOURCE_KEYS.EVENTS_MANAGEMENT}>
          <EventsAdminListScreen />
        </ResourceRoute>
      }
    />
  </>
);
