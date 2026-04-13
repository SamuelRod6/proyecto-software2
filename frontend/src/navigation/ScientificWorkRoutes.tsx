/*
File: ScientificWorkRoutes.tsx

Contains:
Protected route definitions for scientific work participant and management screens.

Course: CI-4712 Ingeniería de Software II
Term: Enero - Marzo 2026
Designed by: Equipo 2 - Arcadian
*/

import { Route } from "react-router-dom";
import { RESOURCE_KEYS } from "../constants/resources";
import ResourceRoute from "./ResourceRoute";
import ScientificWorksScreen from "../screens/scientificWorks/ScientificWorksScreen";
import ScientificWorksManagementScreen from "../screens/scientificWorks/ScientificWorksManagementScreen";

// scientificWorkRoutes groups route entries related to scientific work flows.
export const scientificWorkRoutes = (
    <>
    <Route
      path="scientific-works"
      element={
        <ResourceRoute resourceKey={RESOURCE_KEYS.SCIENTIFIC_WORKS}>
          <ScientificWorksScreen />
        </ResourceRoute>
      }
    />
    <Route
      path="scientific-works-management"
      element={
        <ResourceRoute resourceKey={RESOURCE_KEYS.SCIENTIFIC_WORKS_MANAGEMENT}>
          <ScientificWorksManagementScreen />
        </ResourceRoute>
      }
    />
  </>
);