import { Route } from "react-router-dom";
import { RESOURCE_KEYS } from "../constants/resources";
import ResourceRoute from "./ResourceRoute";
// screens
import RoleManagementListScreen from "../screens/roleManagement/RoleManagementListScreen";

export const roleManagementRoutes = (
  <>
    <Route
      path="roleManagement"
      element={
        <ResourceRoute resourceKey={RESOURCE_KEYS.ROLE_MANAGEMENT}>
          <RoleManagementListScreen />
        </ResourceRoute>
      }
    />
  </>
);
