import { Navigate } from "react-router-dom";
import { ROUTES } from "./routes";
import { getStoredUserRole, isAdminRole } from "../utils/accessControl";

export default function AdminRoute({
    children,
}: {
    children: JSX.Element;
}): JSX.Element {
    const role = getStoredUserRole();
    if (!isAdminRole(role)) {
        return <Navigate to={ROUTES.home} replace />;
    }

    return children;
}
