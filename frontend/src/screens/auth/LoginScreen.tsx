import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
// components
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
// navigation
import { ROUTES } from "../../navigation/routes";
// assets
import usbImage from "../../assets/images/USB.jpg";
// contexts
import { useAuth } from "../../contexts/Auth/Authcontext";
import { isValidEmail } from "../../utils/validators";

export default function LoginScreen(): JSX.Element {
    // hooks
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    // states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

	// button validation
    const isFormValid =
        email.trim() !== "" && password.trim() !== "" && isValidEmail(email);

    // handlers
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isFormValid) return;
        login();
        navigate(ROUTES.home);
    };

	console.log("auth state:", { isAuthenticated });
    return (
        <section className="grid min-h-screen h-screen overflow-hidden bg-slate-900 text-white md:grid-cols-[420px_2fr]">
            <div className="flex flex-col h-full px-10 gap-8">
                <div className="pt-12 pb-2">
                    <h1 className="text-3xl font-semibold">Login</h1>
                    <p className="mt-2 text-sm text-slate-300">
                        Ingresa tus credenciales para continuar.
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <Input
                        label="Usuario"
                        placeholder="usuario@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {/* ToDo: Add eye icon for password visibility */}
                    <Input
                        label="Contraseña"
                        type="password"
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="text-right text-xs text-slate-400">
                        ¿Olvidaste tu contraseña?
                    </div>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={!isFormValid}
                    >
                        Ingresar
                    </Button>
                </form>

                <p className="text-left text-xs text-slate-400">
                    ¿No tienes cuenta?{" "}
                    <Link to={ROUTES.register} className="text-[#F5E427] hover:text-[#E6D51E]">
                        Regístrate
                    </Link>
                </p>
            </div>

            <div className="relative hidden md:block bg-slate-900 pb-4">
                <img
                    src={usbImage}
                    alt="Universidad"
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/70 via-slate-900/30 to-transparent" />
                <div className="absolute bottom-20 left-10 max-w-xxl text-white">
                    <h2 className="text-4xl font-semibold leading-tight">
                        Sistema Automatizado  <br />de Gestión de Eventos Científicos
                    </h2>
                    <p className="mt-3 text-sm text-slate-200">
                        Organiza, coordina y administra eventos desde un solo lugar.
                    </p>
                </div>
            </div>
        </section>
    );
}
