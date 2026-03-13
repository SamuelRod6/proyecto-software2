import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { ROUTES } from "../../navigation/routes";
import usbImage from "../../assets/images/USB.jpg";
import { isValidPassword } from "../../utils/validators";
import { resetPasswordFromRecovery } from "../../services/authServices";

type ResetLocationState = {
  email?: string;
  temporaryKey?: string;
};

export default function NewPasswordScreen(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as ResetLocationState;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    Boolean(state.email) &&
    Boolean(state.temporaryKey) &&
    isValidPassword(newPassword) &&
    newPassword === confirmPassword;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit || isSubmitting || !state.email || !state.temporaryKey) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await resetPasswordFromRecovery({
      email: state.email,
      temporaryKey: state.temporaryKey,
      newPassword: newPassword.trim(),
    });

    if (result.status >= 400) {
      setErrorMessage(result.data?.message || "No se pudo actualizar la contraseña.");
      setIsSubmitting(false);
      return;
    }

    navigate(ROUTES.login, { replace: true });
    setIsSubmitting(false);
  };

  if (!state.email || !state.temporaryKey) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-slate-900 px-6 text-white">
        <div className="max-w-md rounded-xl border border-slate-700 bg-slate-800 p-6 text-center">
          <h1 className="text-xl font-semibold">Falta validación de clave temporal</h1>
          <p className="mt-3 text-sm text-slate-300">
            Primero debes verificar tu clave temporal para crear una nueva contraseña.
          </p>
          <Link to={ROUTES.verifyRecovery} className="mt-4 inline-block text-[#F5E427] hover:text-[#E6D51E]">
            Ir a verificación
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="grid min-h-screen h-screen overflow-hidden bg-slate-900 text-white md:grid-cols-[420px_2fr]">
      <div className="flex flex-col h-full px-10 gap-8">
        <div className="pt-12 pb-2">
          <h1 className="text-3xl font-semibold">Crear nueva contraseña</h1>
          <p className="mt-2 text-sm text-slate-300">
            La contraseña debe tener entre 8 y 20 caracteres, mayúscula, minúscula y número.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Nueva contraseña"
            type="password"
            placeholder="********"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            placeholder="********"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {!isValidPassword(newPassword) && newPassword.length > 0 && (
            <p className="text-xs text-amber-300">
              Debe cumplir: 8-20 caracteres, una mayúscula, una minúscula y un número.
            </p>
          )}
          {newPassword !== confirmPassword && confirmPassword.length > 0 && (
            <p className="text-xs text-amber-300">Las contraseñas no coinciden.</p>
          )}
          {errorMessage && <p className="text-xs text-red-300">{errorMessage}</p>}

          <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
            Guardar nueva contraseña
          </Button>
        </form>
      </div>

      <div className="relative hidden md:block">
        <img src={usbImage} alt="Universidad" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/70 via-slate-900/30 to-transparent" />
      </div>
    </section>
  );
}
