import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
// contexts
import { useAuth } from "../../contexts/Auth/Authcontext";
import { ROUTES } from "../../navigation/routes";

export default function Header() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate(ROUTES.login, { replace: true });
    };
    return (
        <header className="border-b border-slate-800 bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#F5E427] text-slate-900 flex items-center justify-center font-semibold">
                        CL
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Bienvenido</p>
                        <p className="text-base font-semibold text-white">
                            Sistema de Eventos Científicos
                        </p>
                    </div>
                </div>
                {/* ToDo: Create component for search */}
                <div className="flex flex-1 items-center justify-end gap-3">
                    <div className="hidden w-full max-w-sm items-center rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-400 md:flex">
                        Buscar...
                    </div>
                    <button
                        onClick={handleLogout}
                        title="Cerrar sesión"
                        className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700 transition-colors"
                    >
                        <FiLogOut size={22} className="text-white" />
                        <span className="text-slate-200 hidden md:inline">
                            Cerrar sesión
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
}
