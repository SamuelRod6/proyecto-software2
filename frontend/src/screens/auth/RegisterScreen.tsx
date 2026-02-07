import { Link, useNavigate } from "react-router-dom";
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
// services
import { loginUser, registerUser } from "../../services/authServices";
// contexts
import { useAuth } from "../../contexts/Auth/Authcontext";
import { toast } from "react-toastify";

export default function RegisterScreen(): JSX.Element {
    const DEFAULT_ROLE_ID = 4;

    // hooks
    const navigate = useNavigate();
    const { login } = useAuth();

    // states
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // button validation
    const isFormValid =
        fullName.trim() !== "" &&
        password.trim() !== "" &&
        isValidEmail(email) &&
        password === confirmPassword;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isFormValid || isSubmitting) return;

        setIsSubmitting(true);
        setErrorMessage(null);

        const registerResult = await registerUser({
            name: fullName.trim(),
            email: email.trim(),
            password,
            roleId: DEFAULT_ROLE_ID,
        });

        console.log("Register result:", registerResult);

        if (registerResult.status >= 400) {
            setErrorMessage(
                registerResult.data?.message || "No se pudo registrar.",
            );
            setIsSubmitting(false);
            return;
        }

        const loginResult = await loginUser({
            email: email.trim(),
            password,
        });

        if (loginResult.status >= 400) {
            setErrorMessage(
                loginResult.data?.message || "No se pudo iniciar sesion.",
            );
            setIsSubmitting(false);
            return;
        }

        const token = loginResult.data?.payload?.token as string | undefined;
        const user = loginResult.data?.payload?.user as
            | { id: number; name: string; email: string; role: string }
            | undefined;

        if (token) {
            localStorage.setItem("auth-token", token);
        }
        if (user) {
            localStorage.setItem("auth-user", JSON.stringify(user));
        }

        login();
        navigate(ROUTES.home);
        toast.success("Registro exitoso. ¡Bienvenido!");
        setIsSubmitting(false);
    };

    return (
        <section className="grid min-h-screen h-screen overflow-hidden bg-slate-900 text-white md:grid-cols-[420px_2fr]">
            <div className="flex flex-col h-full px-10 gap-8">
                <div className="pt-12 pb-2">
                    <h1 className="text-3xl font-semibold">Regístrate</h1>
                    <p className="mt-2 text-sm text-slate-300">
                        Crea una cuenta para empezar a gestionar eventos.
                    </p>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
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
                    <Input
                        label="Confirmar contraseña"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {errorMessage && (
                        <p className="text-xs text-red-300">{errorMessage}</p>
                    )}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={!isFormValid || isSubmitting}
                    >
                        Registrarme
                    </Button>
                </form>

                <p className="text-left text-xs text-slate-400">
                    ¿Ya tienes cuenta?{" "}
                    <Link
                        to={ROUTES.login}
                        className="text-[#F5E427] hover:text-[#E6D51E]"
                    >
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
                        Centraliza el acceso a tus eventos, sesiones y
                        convocatorias.
                    </p>
                </div>
            </div>
        </section>
    );
}
