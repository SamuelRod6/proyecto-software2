import { NavLink } from "react-router-dom";
import { ROUTES } from "../../navigation/routes";
// contexts
import { useAuth } from "../../contexts/Auth/Authcontext";

export default function Sidebar() {
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN";
    const isParticipant = user?.role === "PARTICIPANTE";
    const isSpeaker = user?.role === "PONENTE";
    const isOrganizer = user?.role === "COMITE CIENTIFICO";
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
                {(isAdmin || isOrganizer) && (
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
            </nav>
        </aside>
    );
}
