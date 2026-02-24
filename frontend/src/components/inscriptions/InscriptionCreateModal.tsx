import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { isValidEmail } from "../../utils/validators";
import { createInscription } from "../../services/inscriptionServices";
import { useToast } from "../../contexts/Toast/ToastContext";
import { ROUTES } from "../../navigation/routes";

interface InscriptionCreateModalProps {
    open: boolean;
    onClose: () => void;
    eventoId: number | null;
    eventoNombre: string;
    userId: number;
    userEmail: string;
    userName: string;
}

export default function InscriptionCreateModal({
    open,
    onClose,
    eventoId,
    eventoNombre,
    userId,
    userEmail,
    userName,
}: InscriptionCreateModalProps): JSX.Element {
    const navigate = useNavigate();
    const [nombre, setNombre] = useState(userName || "");
    const [email, setEmail] = useState(userEmail || "");
    const [afiliacion, setAfiliacion] = useState("");
    const [comprobante, setComprobante] = useState<string>("");
    const [step, setStep] = useState<"form" | "review">("form");
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const maxFileSize = 2 * 1024 * 1024;
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];

    const isFormValid = useMemo(() => {
        return (
            nombre.trim().length > 2 &&
            afiliacion.trim().length > 1 &&
            isValidEmail(email)
        );
    }, [nombre, afiliacion, email]);

    const resetForm = () => {
        setNombre(userName || "");
        setEmail(userEmail || "");
        setAfiliacion("");
        setComprobante("");
        setStep("form");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleFileChange = (file: File | null) => {
        if (!file) {
            setComprobante("");
            return;
        }
        if (!allowedTypes.includes(file.type)) {
            showToast({
                title: "Archivo inválido",
                message: "Solo se permiten PDF o imágenes (PNG/JPG).",
                status: "error",
            });
            return;
        }
        if (file.size > maxFileSize) {
            showToast({
                title: "Archivo muy grande",
                message: "El comprobante no debe superar 2MB.",
                status: "error",
            });
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === "string" ? reader.result : "";
            setComprobante(result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!eventoId || !isFormValid) return;
        setLoading(true);
        const { status, data } = await createInscription({
            id_evento: eventoId,
            id_usuario: userId,
            nombre_participante: nombre.trim(),
            email: email.trim(),
            afiliacion: afiliacion.trim(),
            comprobante_pago: comprobante,
        });
        if (status >= 400) {
            showToast({
                title: "Error",
                message: data?.message || "No se pudo registrar la inscripción",
                status: "error",
            });
            setLoading(false);
            return;
        }
        showToast({
            title: "Inscripción registrada",
            message: "Tu inscripción fue registrada correctamente.",
            status: "success",
        });
        setLoading(false);
        handleClose();
        navigate(ROUTES.myInscriptions);
    };

    return (
        <Modal open={open} onClose={handleClose} title="Inscribirme" className="max-w-2xl">
            <div className="space-y-6">
                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-slate-200">
                    <p className="text-sm">Evento</p>
                    <p className="text-lg font-semibold text-[#F5E427]">{eventoNombre}</p>
                </div>

                {step === "form" ? (
                    <div className="space-y-4">
                        <Input
                            label="Nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />
                        <Input
                            label="Correo"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Input
                            label="Afiliación"
                            placeholder="Ej: Universidad Simón Bolívar, Laboratorio X, Independiente"
                            value={afiliacion}
                            onChange={(e) => setAfiliacion(e.target.value)}
                        />
                        <p className="text-xs text-slate-400">
                            Indica tu institución, empresa o grupo de investigación.
                        </p>
                        <label className="block text-sm text-slate-200">
                            Comprobante de pago (opcional)
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                className="mt-2 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100"
                                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                            />
                        </label>

                        <div className="flex gap-3">
                            <Button
                                className="w-full"
                                disabled={!isFormValid}
                                onClick={() => setStep("review")}
                            >
                                Revisar inscripción
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full border border-slate-600"
                                onClick={handleClose}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-200">
                            <p className="font-semibold">Resumen</p>
                            <p className="mt-2">Nombre: {nombre}</p>
                            <p>Correo: {email}</p>
                            <p>Afiliación: {afiliacion}</p>
                            <p>Comprobante: {comprobante ? "Adjunto" : "No adjunto"}</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                className="w-full"
                                disabled={loading}
                                onClick={handleSubmit}
                            >
                                Confirmar inscripción
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="w-full border border-slate-600"
                                onClick={() => setStep("form")}
                            >
                                Editar
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
