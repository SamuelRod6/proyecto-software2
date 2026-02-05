import { Link } from "react-router-dom";
import { useState } from "react";
// components
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
// navigation
import { ROUTES } from "../../navigation/routes";
// assets
import usbImage from "../../assets/images/USB.jpg";
// utils
import { isValidEmail } from "../../utils/validators";

export default function RegisterScreen(): JSX.Element {
    // states
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // button validation
    const isFormValid =
        fullName.trim() !== "" && password.trim() !== "" && isValidEmail(email);

    return (
        <section className="grid min-h-screen h-screen overflow-hidden bg-slate-900 text-white md:grid-cols-[420px_2fr]">
            <div className="flex flex-col h-full px-10 gap-8">
                <div className="pt-12 pb-2">
                    <h1 className="text-3xl font-semibold">Regístrate</h1>
                    <p className="mt-2 text-sm text-slate-300">
                        Crea una cuenta para empezar a gestionar eventos.
                    </p>
                </div>

                <form className="space-y-4">
                    <Input
                        label="Nombre completo"
                        placeholder="Nombre Apellido"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                    />
                    <Input
                        label="Correo"
                        type="email"
                        placeholder="correo@dominio.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        label="Contraseña"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button type="button" className="w-full" disabled={!isFormValid}>
                        Registrarme
                    </Button>
                </form>

                <p className="text-left text-xs text-slate-400">
                    ¿Ya tienes cuenta?{" "}
                    <Link to={ROUTES.login} className="text-[#F5E427] hover:text-[#E6D51E]">
                        Inicia sesión
                    </Link>
                </p>
            </div>

            <div className="relative hidden md:block">
                <img
                    src={usbImage}
                    alt="Universidad"
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/70 via-slate-900/30 to-transparent" />
                <div className="absolute bottom-20 left-10 max-w-xxl text-white">
                    <h2 className="text-4xl font-semibold leading-tight">
                        Bienvenido al portal académico
                    </h2>
                    <p className="mt-3 text-sm text-slate-200">
                        Centraliza el acceso a tus eventos, sesiones y convocatorias.
                    </p>
                </div>
            </div>
        </section>
    );
}
