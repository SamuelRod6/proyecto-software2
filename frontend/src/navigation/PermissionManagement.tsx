import { Route } from "react-router-dom";
import AdminRoute from "./AdminRoute";
import PermissionManagementScreen from "../screens/permissionManagement/PermissionManagementScreen";

export const permissionManagementRoutes = (
  <>
    <Route
      path="permissionManagement"
      element={
        <AdminRoute>
          <PermissionManagementScreen />
        </AdminRoute>
      }
    />
  </>
);
