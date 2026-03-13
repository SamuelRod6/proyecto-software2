import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { ROUTES } from "../../navigation/routes";
import usbImage from "../../assets/images/USB.jpg";
import { isValidEmail } from "../../utils/validators";
import { requestPasswordRecovery } from "../../services/authServices";

export default function ForgotPasswordScreen(): JSX.Element {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = isValidEmail(email);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await requestPasswordRecovery({ email: email.trim() });
    if (result.status >= 400) {
      setErrorMessage(result.data?.message || "No se pudo procesar la solicitud.");
      setIsSubmitting(false);
      return;
    }

    setMessage("Si el correo existe, te enviamos una clave temporal valida por 1 hora.");
    setIsSubmitting(false);
  };

  return (
    <section className="grid min-h-screen h-screen overflow-hidden bg-slate-900 text-white md:grid-cols-[420px_2fr]">
      <div className="flex flex-col h-full px-10 gap-8">
        <div className="pt-12 pb-2">
          <h1 className="text-3xl font-semibold">Recuperar contraseña</h1>
          <p className="mt-2 text-sm text-slate-300">
            Ingresa tu correo y te enviaremos una clave temporal.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Correo registrado"
            type="email"
            placeholder="usuario@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {errorMessage && <p className="text-xs text-red-300">{errorMessage}</p>}
          {message && <p className="text-xs text-emerald-300">{message}</p>}

          <Button type="submit" className="w-full" disabled={!isFormValid || isSubmitting}>
            Enviar clave temporal
          </Button>

          {message && (
            <Button
              type="button"
              className="w-full"
              onClick={() => navigate(ROUTES.verifyRecovery, { state: { email: email.trim() } })}
            >
              Ya tengo la clave temporal
            </Button>
          )}
        </form>

        <p className="text-left text-xs text-slate-400">
          Volver a{" "}
          <Link to={ROUTES.login} className="text-[#F5E427] hover:text-[#E6D51E]">
            iniciar sesión
          </Link>
        </p>
      </div>

      <div className="relative hidden md:block">
        <img src={usbImage} alt="Universidad" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/70 via-slate-900/30 to-transparent" />
      </div>
    </section>
  );
}
