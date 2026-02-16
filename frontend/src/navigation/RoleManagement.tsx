import { Route } from "react-router-dom";
// screens
import RoleManagementListScreen from "../screens/roleManagement/RoleManagementListScreen";

export const roleManagementRoutes = (
	<>
		<Route path="roleManagement" element={<RoleManagementListScreen />} />
	</>
);
