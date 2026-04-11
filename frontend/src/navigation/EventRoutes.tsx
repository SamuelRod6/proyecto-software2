/*
File: EventRoutes.tsx

Contains:
Route definitions for participant events view and protected event management view.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

import { Route } from "react-router-dom";
import { RESOURCE_KEYS } from "../constants/resources";
import ResourceRoute from "./ResourceRoute";
// screens
import EventsAdminListScreen from "../screens/events/EventsAdminListScreen";
import EventsParticipantListScreen from "../screens/events/EventsParticipantListScreen";

// eventRoutes groups routes related to event browsing and administration.
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
