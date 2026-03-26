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
import { isValidEmail, isValidPassword } from "../../utils/validators";
// services
import {
  loginUser,
  registerUser,
  requestRegisterTemporaryKey,
  verifyRegisterTemporaryKey,
} from "../../services/authServices";
// contexts
import { useAuth } from "../../contexts/Auth/Authcontext";
import { toast } from "react-toastify";

export default function RegisterScreen(): JSX.Element {
  // hooks
  const navigate = useNavigate();
  const { login } = useAuth();

  // states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [temporaryKey, setTemporaryKey] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"request" | "verify" | "password">(
    "request",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRequestStepValid = fullName.trim() !== "" && isValidEmail(email);
  const isVerifyStepValid =
    isValidEmail(email) && temporaryKey.trim().length >= 6;
  const isPasswordStepValid =
    isValidPassword(password) &&
    password === confirmPassword &&
    fullName.trim() !== "" &&
    isValidEmail(email) &&
    temporaryKey.trim() !== "";

  const handleRequestTemporaryKey = async () => {
    const result = await requestRegisterTemporaryKey({
      name: fullName.trim(),
      email: email.trim(),
    });

    if (result.status >= 400) {
      setErrorMessage(
        result.data?.message || "No se pudo enviar la clave temporal.",
      );
      return;
    }

    setStep("verify");
    toast.info("Te enviamos una clave temporal al correo.");
  };

  const handleVerifyTemporaryKey = async () => {
    const normalizedKey = temporaryKey.trim().toUpperCase();
    const result = await verifyRegisterTemporaryKey({
      email: email.trim(),
      temporaryKey: normalizedKey,
    });

    if (result.status >= 400) {
      setErrorMessage(
        result.data?.message || "Clave temporal invalida o vencida.",
      );
      return;
    }

    setTemporaryKey(normalizedKey);
    setStep("password");
    toast.success("Clave temporal verificada.");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    if (step === "request") {
      if (!isRequestStepValid) {
        setIsSubmitting(false);
        return;
      }
      await handleRequestTemporaryKey();
      setIsSubmitting(false);
      return;
    }

    if (step === "verify") {
      if (!isVerifyStepValid) {
        setIsSubmitting(false);
        return;
      }
      await handleVerifyTemporaryKey();
      setIsSubmitting(false);
      return;
    }

    if (!isPasswordStepValid) {
      setIsSubmitting(false);
      return;
    }

    const registerResult = await registerUser({
      name: fullName.trim(),
      email: email.trim(),
      password,
      temporaryKey: temporaryKey.trim().toUpperCase(),
    });

    if (registerResult.status >= 400) {
      setErrorMessage(registerResult.data?.message || "No se pudo registrar.");
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
      | {
          id: number;
          name: string;
          email: string;
          roles: { id: number; name: string }[];
        }
      | undefined;

    if (token) {
      localStorage.setItem("auth-token", token);
    }
    if (user) {
      localStorage.setItem("auth-user", JSON.stringify(user));
    }

    login(user ?? null);
    navigate(ROUTES.home);
    toast.success("Registro exitoso. ¡Bienvenido!");
    setIsSubmitting(false);
  };

  let submitLabel = "Crear cuenta";
  if (step === "request") {
    submitLabel = "Enviar clave temporal";
  } else if (step === "verify") {
    submitLabel = "Validar clave";
  }

  const isSubmitDisabled =
    isSubmitting ||
    (step === "request" && !isRequestStepValid) ||
    (step === "verify" && !isVerifyStepValid) ||
    (step === "password" && !isPasswordStepValid);

  return (
    <section className="grid min-h-screen h-screen overflow-hidden bg-slate-900 text-white md:grid-cols-[420px_2fr]">
      <div className="flex flex-col h-full px-10 gap-8">
        <div className="pt-12 pb-2">
          <h1 className="text-3xl font-semibold">Regístrate</h1>
          <p className="mt-2 text-sm text-slate-300">
            Primero valida tu correo con una clave temporal y luego define tu
            contraseña.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Nombre completo"
            placeholder="Nombre Apellido"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={step !== "request"}
          />
          <Input
            label="Correo"
            type="email"
            placeholder="correo@dominio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={step !== "request"}
          />

          {step !== "request" && (
            <Input
              label="Clave temporal"
              placeholder="ABCD1234"
              value={temporaryKey}
              onChange={(e) => setTemporaryKey(e.target.value)}
              disabled={step === "password"}
            />
          )}

          {step === "password" && (
            <>
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
              {!isValidPassword(password) && password.length > 0 && (
                <p className="text-xs text-amber-300">
                  Debe cumplir: 8-20 caracteres, una mayúscula, una minúscula y
                  un número.
                </p>
              )}
            </>
          )}

          {errorMessage && (
            <p className="text-xs text-red-300">{errorMessage}</p>
          )}

          {step === "verify" && (
            <button
              type="button"
              className="text-xs text-[#F5E427] hover:text-[#E6D51E]"
              onClick={() => {
                if (isSubmitting) return;
                setErrorMessage(null);
                void handleRequestTemporaryKey();
              }}
            >
              Reenviar clave temporal
            </button>
          )}

          {(step === "verify" || step === "password") && (
            <button
              type="button"
              className="block text-xs text-slate-300 hover:text-white"
              onClick={() => {
                if (isSubmitting) return;
                setStep("request");
                setTemporaryKey("");
                setPassword("");
                setConfirmPassword("");
                setErrorMessage(null);
              }}
            >
              Cambiar nombre/correo
            </button>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitDisabled}>
            {submitLabel}
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
            Centraliza el acceso a tus eventos, sesiones y convocatorias.
          </p>
        </div>
      </div>
    </section>
  );
}
