import React, { useState } from "react";
// components
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Loader from "../ui/Loader";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    evento: any;
    onSubmit: (data: any) => Promise<void>;
    loading: boolean;
}

const EventInscriptionModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    evento, 
    onSubmit, 
    loading 
}) => {
    // form state
    const [form, setForm] = useState({
        comentario: "",
        estado_pago: false,
        comprobante: "",
    });

    // handle form changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(form);
    };

    return (
        <Modal 
            open={isOpen} 
            onClose={onClose} 
            title={`Inscripción para ${evento?.nombre}`}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Comentario (opcional)"
                    name="comentario"
                    value={form.comentario}
                    onChange={handleChange}
                />
                <div>
                    <label className="flex items-center gap-2 text-slate-300 font-medium">
                        <input
                            type="checkbox"
                            name="estado_pago"
                            checked={form.estado_pago}
                            onChange={handleChange}
                        />
                        ¿Pago realizado?
                    </label>
                </div>
                <Input
                    label="Comprobante (opcional)"
                    name="comprobante"
                    value={form.comprobante}
                    onChange={handleChange}
                    placeholder="Número o referencia de pago"
                />
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        className="bg-yellow-400 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-yellow-500 transition"
                        disabled={loading}
                    >
                        Confirmar inscripción
                    </Button>
                </div>
            </form>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 z-50">
                    <Loader visible={true} />
                </div>
            )}
        </Modal>
    );
};

export default EventInscriptionModal;