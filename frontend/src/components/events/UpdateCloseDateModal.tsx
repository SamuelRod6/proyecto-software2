import { useState, useEffect } from "react";
//components
import Modal from "../ui/Modal";
import DayPickerSingle from "../ui/DayPickerSingle";
import Button from "../ui/Button";
import BackArrow from "../ui/BackArrow";
// contexts
import { useToast } from "../../contexts/Toast/ToastContext";
// APIs
import { Evento } from "../../services/eventsServices";

interface UpdateCloseDateModalProps {
    open: boolean;
    onClose: () => void;
    event: Evento;
}

export default function UpdateCloseDateModal({ open, onClose, event }: UpdateCloseDateModalProps) {
    const { showToast } = useToast();
    const [closeDate, setCloseDate] = useState<Date | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    // Save the original date to compare changes
    const originalDate = parseDate(event.fecha_cierre_inscripcion);

    // Helper for parse date string DD/MM/YYYY
    function parseDate(dateStr: string): Date | undefined {
        if (!dateStr) return undefined;
        const [day, month, year] = dateStr.split("/");
        return new Date(Number(year), Number(month) - 1, Number(day));
    }

    // Helper to format date to DD/MM/YYYY
    function formatDate(d: Date): string {
        return d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    // Initialize current date
    useEffect(() => {
        if (open) setCloseDate(parseDate(event.fecha_cierre_inscripcion));
    }, [open, event.fecha_cierre_inscripcion]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!closeDate) {
            showToast({
                title: "Faltan datos",
                message: "Selecciona una nueva fecha de cierre.",
                status: "error",
            });
            return;
        }
        setLoading(true);
        // try {
        //     const { status, data } = await ;
        //     if (status === 200) {
        //         showToast({
        //             title: "Fecha actualizada",
        //             message: "La fecha de cierre de inscripciones fue actualizada exitosamente.",
        //             status: "success",
        //         });
        //         onClose();
        //         window.location.href = "/events";
        //     } else {
        //         showToast({
        //             title: "Error al actualizar",
        //             message: data?.error || "No se pudo actualizar la fecha.",
        //             status: "error",
        //         });
        //     }
        // } catch (err: any) {
        //     showToast({
        //         title: "Error inesperado",
        //         message: err.message || "Ocurrió un error inesperado.",
        //         status: "error",
        //     });
        // } finally {
        //     setLoading(false);
        // }
    };

    // Only enable change if date is different from original
    const isChangeEnabled = !!closeDate && (!originalDate || closeDate.getTime() !== originalDate.getTime());

    return (
        <Modal open={open} onClose={onClose} title="Actualiza la fecha de cierre de tus inscripciones" className="max-w-screen-lg w-full">
            <form 
                onSubmit={handleSubmit} 
                className="rounded-xl border border-slate-700 bg-slate-800/90 p-10 max-w-[900px] w-full mx-auto shadow-lg flex flex-col md:flex-row gap-8 md:gap-10"
            >
                <div className="flex-1 flex flex-col justify-center items-center">
                    <label className="block mb-2 text-slate-300 font-medium text-lg">
                        Nueva fecha de cierre
                    </label>
                    <div className="w-full bg-[#e3e8f0] rounded-xl p-5 flex items-center justify-center">
                        <DayPickerSingle
                            selected={closeDate}
                            onSelect={setCloseDate}
                            className="bg-[#e3e8f0] rounded p-2"
                            maxDate={parseDate(event.fecha_inicio) ? new Date(parseDate(event.fecha_inicio)!.getTime() - 86400000) : undefined}
                        />
                    </div>
                </div>
                <div className="flex-1 flex flex-col gap-6 justify-center relative">
                    <div className="absolute left-0 top-0">
                        <BackArrow onClick={onClose}/>
                    </div>
                    <div className="flex flex-col justify-center h-full">
                        <p className="text-slate-300 text-lg mb-4">
                            Selecciona la nueva fecha límite para inscripciones. Debe ser anterior a la fecha de inicio del evento.
                        </p>
                    </div>
                    <div className="flex gap-4 mt-8">
                        <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={!isChangeEnabled}
                        >
                            Cambiar
                        </Button>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            className="w-full border border-slate-600" 
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
}
