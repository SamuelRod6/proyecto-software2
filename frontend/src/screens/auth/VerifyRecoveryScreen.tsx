import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { ROUTES } from "../../navigation/routes";
import usbImage from "../../assets/images/USB.jpg";
import { isValidEmail } from "../../utils/validators";
import { verifyPasswordRecovery } from "../../services/authServices";

type VerifyLocationState = {
  email?: string;
};

export default function VerifyRecoveryScreen(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as VerifyLocationState;

  const [email, setEmail] = useState(state.email ?? "");
  const [temporaryKey, setTemporaryKey] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = isValidEmail(email) && temporaryKey.trim().length >= 6;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      email: email.trim(),
      temporaryKey: temporaryKey.trim().toUpperCase(),
    };
    const result = await verifyPasswordRecovery(payload);

    if (result.status >= 400) {
      setErrorMessage(result.data?.message || "Clave temporal invalida o vencida.");
      setIsSubmitting(false);
      return;
    }

    navigate(ROUTES.resetRecoveredPassword, { state: payload });
    setIsSubmitting(false);
  };

  return (
    <section className="grid min-h-screen h-screen overflow-hidden bg-slate-900 text-white md:grid-cols-[420px_2fr]">
      <div className="flex flex-col h-full px-10 gap-8">
        <div className="pt-12 pb-2">
          <h1 className="text-3xl font-semibold">Verificar clave temporal</h1>
          <p className="mt-2 text-sm text-slate-300">
            Ingresa la clave que recibiste por correo para continuar.
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
          <Input
            label="Clave temporal"
            placeholder="ABCD1234"
            value={temporaryKey}
            onChange={(e) => setTemporaryKey(e.target.value)}
          />

          {errorMessage && <p className="text-xs text-red-300">{errorMessage}</p>}

          <Button type="submit" className="w-full" disabled={!isFormValid || isSubmitting}>
            Validar clave
          </Button>
        </form>

        <p className="text-left text-xs text-slate-400">
          ¿No tienes clave?
          <Link to={ROUTES.forgotPassword} className="ml-1 text-[#F5E427] hover:text-[#E6D51E]">
            Solicitar otra
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
