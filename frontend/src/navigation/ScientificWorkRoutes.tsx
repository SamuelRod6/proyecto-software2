import { Route } from "react-router-dom";
import { RESOURCE_KEYS } from "../constants/resources";
import ResourceRoute from "./ResourceRoute";
import ScientificWorksScreen from "../screens/scientificWorks/ScientificWorksScreen";
import ScientificWorksManagementScreen from "../screens/scientificWorks/ScientificWorksManagementScreen";

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