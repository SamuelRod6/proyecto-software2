import { Route } from "react-router-dom";
// screens
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import VerifyRecoveryScreen from "../screens/auth/VerifyRecoveryScreen";
import NewPasswordScreen from "../screens/auth/NewPasswordScreen";

export const authRoutes = (
  <>
    <Route path="login" element={<LoginScreen />} />
    <Route path="register" element={<RegisterScreen />} />
    <Route path="forgot-password" element={<ForgotPasswordScreen />} />
    <Route path="forgot-password/verify" element={<VerifyRecoveryScreen />} />
    <Route
      path="forgot-password/new-password"
      element={<NewPasswordScreen />}
    />
  </>
);
