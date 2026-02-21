import { Route } from "react-router-dom";
import PermissionManagementScreen from "../screens/permissionManagement/PermissionManagementScreen";

export const permissionManagementRoutes = (
    <>
        <Route path="permissionManagement" element={<PermissionManagementScreen />} />
    </>
);
