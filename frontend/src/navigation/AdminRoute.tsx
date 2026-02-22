import { Navigate } from "react-router-dom";
import { ROUTES } from "./routes";
import { isAdminUser } from "../utils/accessControl";

export default function AdminRoute({
    children,
}: {
    children: JSX.Element;
}): JSX.Element {
    if (!isAdminUser()) {
      return <Navigate to={ROUTES.home} replace />;
    }

    return children;
}
