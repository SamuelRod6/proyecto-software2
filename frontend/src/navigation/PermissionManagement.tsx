import { Route } from "react-router-dom";
import { RESOURCE_KEYS } from "../constants/resources";
import ResourceRoute from "./ResourceRoute";
import PermissionManagementScreen from "../screens/permissionManagement/PermissionManagementScreen";

export const permissionManagementRoutes = (
  <>
    <Route
      path="permissionManagement"
      element={
        <ResourceRoute resourceKey={RESOURCE_KEYS.PERMISSION_MANAGEMENT}>
          <PermissionManagementScreen />
        </ResourceRoute>
      }
    />
  </>
);
