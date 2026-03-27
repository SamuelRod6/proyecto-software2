import { Navigate } from "react-router-dom";
// navigation
import { ROUTES } from "./routes";
// contexts
import { useAuth } from "../contexts/Auth/Authcontext";

export default function ProtectedRoute({
    children,
}: {
    children: JSX.Element;
}): JSX.Element {
	const { isAuthenticated } = useAuth();

	if (!isAuthenticated) {
		return <Navigate to={ROUTES.login} replace />;
	}

	return children;
}
