import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "../../navigation/routes";
import { RESOURCE_KEYS } from "../../constants/resources";
import { hasResourceAccess } from "../../utils/accessControl";

function getAuthUser() {
    const raw = localStorage.getItem("auth-user");
    if (!raw) return null;
    try {
        return JSON.parse(raw) as { id: number; name: string; email: string; role: string };
    } catch {
        return null;
    }
}

export default function Sidebar() {
    const authUser = getAuthUser();
    const isAdmin = authUser?.role === "ADMIN";

    const [canManageRoles, setCanManageRoles] = useState(false);
    const [canManagePermissions, setCanManagePermissions] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const checkAccess = async () => {
        const [rolesAccess, permissionsAccess] = await Promise.all([
            hasResourceAccess(RESOURCE_KEYS.ROLE_MANAGEMENT),
            hasResourceAccess(RESOURCE_KEYS.PERMISSION_MANAGEMENT),
        ]);
        if (isMounted) {
            setCanManageRoles(rolesAccess);
            setCanManagePermissions(permissionsAccess);
        }
        };
        void checkAccess();
        return () => {
        isMounted = false;
        };
    }, []);

    return (
        <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-800 p-6 md:flex">
            <div className="text-lg font-semibold text-[#F5E427]">
                USB
            </div>
            <p className="mt-1 text-xs text-slate-400">
                Gestión de eventos
            </p>
            <nav className="mt-6 flex flex-col gap-1 text-sm">
                <NavLink
                    to={ROUTES.home}
                    className={({ isActive }) =>
                        `rounded-lg px-3 py-2 font-medium transition-colors ${
                        isActive
                            ? "bg-[#F5E427] text-slate-900"
                            : "text-slate-300 hover:bg-slate-700 hover:text-[#F5E427]"
                        }`
                    }
                >
                    Inicio
                </NavLink>
                <NavLink
                    to={ROUTES.events}
                    className={({ isActive }) =>
                        `rounded-lg px-3 py-2 font-medium transition-colors ${
                        isActive
                            ? "bg-[#F5E427] text-slate-900"
                            : "text-slate-300 hover:bg-slate-700 hover:text-[#F5E427]"
                        }`
                    }
                >
                    Eventos
                </NavLink>
                <NavLink
                    to={ROUTES.inscriptions}
                    end
                    className={({ isActive }) =>
                        `rounded-lg px-3 py-2 font-medium transition-colors ${
                        isActive
                            ? "bg-[#F5E427] text-slate-900"
                            : "text-slate-300 hover:bg-slate-700 hover:text-[#F5E427]"
                        }`
                    }
                >
                    Inscripciones
                </NavLink>
                <NavLink
                    to={ROUTES.myInscriptions}
                    end
                    className={({ isActive }) =>
                        `rounded-lg px-3 py-2 font-medium transition-colors ${
                        isActive
                            ? "bg-[#F5E427] text-slate-900"
                            : "text-slate-300 hover:bg-slate-700 hover:text-[#F5E427]"
                        }`
                    }
                >
                    Mis inscripciones
                </NavLink>
                {isAdmin ? (
                    <>
                        <NavLink
                            to={ROUTES.inscriptionsAdmin}
                            end
                            className={({ isActive }) =>
                                `rounded-lg px-3 py-2 font-medium transition-colors ${
                                isActive
                                    ? "bg-[#F5E427] text-slate-900"
                                    : "text-slate-300 hover:bg-slate-700 hover:text-[#F5E427]"
                                }`
                            }
                        >
                            Gestionar Inscripciones
                        </NavLink>

                        <NavLink
                            to={ROUTES.inscriptionsReports}
                            end
                            className={({ isActive }) =>
                                `rounded-lg px-3 py-2 font-medium transition-colors ${
                                isActive
                                    ? "bg-[#F5E427] text-slate-900"
                                    : "text-slate-300 hover:bg-slate-700 hover:text-[#F5E427]"
                                }`
                            }
                        >
                            Reportes
                        </NavLink>
                    </>
                ) : null}
                
                {canManageRoles && (
                    <NavLink
                        to={ROUTES.roleManagement}
                        className={({ isActive }) =>
                        `rounded-lg px-3 py-2 font-medium transition-colors ${
                            isActive
                            ? "bg-[#F5E427] text-slate-900"
                            : "text-slate-300 hover:bg-slate-700 hover:text-[#F5E427]"
                        }`
                        }
                    >
                        Gestión de roles
                    </NavLink>
                    )}
                    {canManagePermissions && (
                    <NavLink
                        to={ROUTES.permissionManagement}
                        className={({ isActive }) =>
                        `rounded-lg px-3 py-2 font-medium transition-colors ${
                            isActive
                            ? "bg-[#F5E427] text-slate-900"
                            : "text-slate-300 hover:bg-slate-700 hover:text-[#F5E427]"
                        }`
                        }
                    >
                        Gestión de permisos y recursos
                    </NavLink>
                )}
                
            </nav>
        </aside>
    );
}
