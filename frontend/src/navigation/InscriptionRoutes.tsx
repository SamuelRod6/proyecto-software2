import { Route } from "react-router-dom";
import { RESOURCE_KEYS } from "../constants/resources";
import ResourceRoute from "./ResourceRoute";
import MyInscriptionsScreen from "../screens/inscriptions/MyInscriptionsScreen";
import InscriptionAdminScreen from "../screens/inscriptions/InscriptionAdminScreen";
import InscriptionReportsScreen from "../screens/inscriptions/InscriptionReportsScreen";

export const inscriptionRoutes = (
  <>
    <Route path="inscriptions/mine" element={<MyInscriptionsScreen />} />
    <Route
      path="inscriptions/admin"
      element={
        <ResourceRoute resourceKey={RESOURCE_KEYS.INSCRIPTIONS_MANAGEMENT}>
          <InscriptionAdminScreen />
        </ResourceRoute>
      }
    />
    <Route
      path="inscriptions/reports"
      element={
        <ResourceRoute resourceKey={RESOURCE_KEYS.INSCRIPTIONS_MANAGEMENT}>
          <InscriptionReportsScreen />
        </ResourceRoute>
      }
    />
  </>
);
