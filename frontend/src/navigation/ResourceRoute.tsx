import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { ROUTES } from "./routes";
import { hasResourceAccess } from "../utils/accessControl";

type ResourceRouteProps = {
    resourceKey: string;
    children: JSX.Element;
};

export default function ResourceRoute({
    resourceKey,
    children,
}: ResourceRouteProps): JSX.Element {
    const [allowed, setAllowed] = useState<boolean | null>(null);

    useEffect(() => {
        let isMounted = true;
        const checkAccess = async () => {
            const access = await hasResourceAccess(resourceKey);
            if (isMounted) {
                setAllowed(access);
            }
        };
        void checkAccess();
        return () => {
            isMounted = false;
        };
    }, [resourceKey]);

    if (allowed === null) {
        return <div className="min-h-[200px]" />;
    }

    if (!allowed) {
        return <Navigate to={ROUTES.home} replace />;
    }

    return children;
}
