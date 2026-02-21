import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
// contexts
import { useAuth } from "../../contexts/Auth/Authcontext";
import { ROUTES } from "../../navigation/routes";

export default function Header() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const storedUser = (() => {
      if (typeof window === "undefined") return null;
      const raw = localStorage.getItem("auth-user");
      if (!raw) return null;
      try {
        return JSON.parse(raw) as {
          name?: string;
          email?: string;
          role?: string;
        };
      } catch {
        return null;
      }
    })();

    const initials = (() => {
      const name = storedUser?.name?.trim() || "";
      if (!name) return "US";
      const parts = name.split(/\s+/).filter(Boolean);
      const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
      const combined = letters.join("");
      return combined || "US";
    })();

    const handleLogout = () => {
        logout();
        navigate(ROUTES.login, { replace: true });
    };
    return (
      <header className="border-b border-slate-800 bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#F5E427] text-slate-900 flex items-center justify-center font-semibold">
              {initials}
            </div>
            <div>
              <p className="text-base font-semibold text-white">
                {storedUser?.name || "Usuario"}
              </p>
              <p className="text-sm text-slate-400">
                {storedUser?.email || "Sin correo"}
                {storedUser?.role ? ` • ${storedUser.role}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-3">
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
