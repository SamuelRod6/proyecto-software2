import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
// navigation
import { ROUTES } from "./routes";
import { authRoutes } from "./AuthRoutes";
import ProtectedRoute from "./ProtectedRoute";
import { eventRoutes } from "./EventRoutes";
import { roleManagementRoutes } from "./RoleManagement";
import { permissionManagementRoutes } from "./PermissionManagement";
import { inscriptionRoutes } from "./InscriptionRoutes";
import { mensajesRoutes } from "./MensajesRoutes";
// screens
import HomeScreen from "../screens/HomeScreen";
// contexts
import { AuthProvider } from "../contexts/Auth/Authcontext";

export default function AppRouter(): JSX.Element {
	return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {authRoutes}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomeScreen />} />
            {eventRoutes}
            {inscriptionRoutes}
            {roleManagementRoutes}
            {permissionManagementRoutes}
            {mensajesRoutes}
          </Route>
          <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
