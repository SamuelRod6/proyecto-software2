import { Route } from "react-router-dom";
// screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

export const authRoutes = (
	<>
		<Route path="login" element={<LoginScreen />} />
		<Route path="register" element={<RegisterScreen />} />
	</>
);
