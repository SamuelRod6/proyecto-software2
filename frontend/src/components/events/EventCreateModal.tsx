import { useState } from "react";
import { DateRange } from "react-day-picker";
// contexts
import { useLoader } from "../../contexts/Loader/LoaderContext";
import { useToast } from "../../contexts/Toast/ToastContext";
// components
import Modal from "../ui/Modal";
import DateRangePicker from "../ui/DateRangePicker";
import SelectInput from "../ui/SelectorInput";
import Button from "../ui/Button";
import Input from "../ui/Input";
// APIs
import { createEvent } from "../../services/eventsServices";
// constants
import { venezuelaCities } from "../../constants/venezuelaCities";


interface EventCreateModalProps {
	open: boolean;
	onClose: () => void;
}

export default function EventCreateModal({ open, onClose }: EventCreateModalProps): JSX.Element {
	// states
	const [name, setName] = useState("");
	const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
	const [country, setCountry] = useState("");
	const [city, setCity] = useState("");
	// contexts
	const { showLoader, hideLoader } = useLoader();
	const { showToast } = useToast();

	// clean up and close modal
	const handleClose = () => {
		setName("");
		setDateRange(undefined);
		setCountry("");
		setCity("");
		onClose();
	};

	// helper to format date
	function formatDate(d: Date): string {
		return d.toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" });
	}

	// function to form the payload
	function getEventPayload() {
		if (!name || !dateRange || !dateRange.from || !dateRange.to || !country || !city) {
			return null;
		}
		return {
			nombre: name,
			fecha_inicio: formatDate(dateRange.from),
			fecha_fin: formatDate(dateRange.to),
			ubicacion: `${city}, ${country}`,
		};
	}

	// submit handler
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		showLoader();
		try {
			const payload = getEventPayload();
			const { status, data } = await createEvent(payload);
			if (status === 200 && data) {
				showToast({
					title: "Evento creado",
					message: "El evento ha sido creado exitosamente.",
					status: "success",
				});
				if (onClose) onClose();
			} else {
				showToast({
					title: "Error al crear evento",
					message: data?.error || "No se pudo crear el evento.",
					status: "error",
				});
			}
		} catch (err: any) {
			showToast({
				title: "Error al crear evento",
				message: err.message || "El evento no pudo ser creado, ocurrió un error inesperado.",
				status: "error",
			});
		} finally {
			hideLoader();
		}
	};

	return (
		<Modal open={open} onClose={handleClose} title="Crear evento" className="max-w-screen-lg w-full">
			<form 
				onSubmit={handleSubmit} 
				className="rounded-xl border border-slate-700 bg-slate-800/90 p-10 max-w-[900px] w-full mx-auto shadow-lg"
			>
				<div className="flex flex-col md:flex-row gap-8 md:gap-10">
					<div className="flex-1 flex flex-col justify-center items-center">
						<label className="block mb-2 text-slate-300 font-medium text-lg">
							Fechas del evento
						</label>
						<div className="w-full bg-[#e3e8f0] rounded-xl p-5 flex items-center justify-center">
							<DateRangePicker
								value={dateRange}
								onChange={setDateRange}
								fromLabel="Inicio"
								toLabel="Fin"
								className="bg-[#e3e8f0] rounded p-2"
							/>
						</div>
					</div>

					<div className="flex-1 flex flex-col gap-6 justify-center">
						<div>
							<label className="block mb-1 text-slate-300 font-medium">
								Nombre del evento
							</label>
							<Input
								type="text"
								placeholder="Ej: Expo de galaxias"
								value={name}
								onChange={e => setName(e.target.value)}
								required
								className="w-[380px] max-w-full"
							/>
						</div>
						<div>
							<SelectInput
								value={country}
								onChange={setCountry}
								options={[{ value: "Venezuela", label: "Venezuela" }]}
								inputLabel="País"
								placeholder="Selecciona el país"
								className="mt-2 w-[380px] max-w-full"
								allowCustom={false}
							/>
							{country === "Venezuela" && (
								<SelectInput
									value={city}
									onChange={setCity}
									options={venezuelaCities.map(city => ({ value: city, label: city }))}
									inputLabel="Ciudad"
									placeholder="Selecciona o escribe la ciudad"
									className="mt-2 w-[380px] max-w-full"
									allowCustom={true}
									customPlaceholder="Escribe la ciudad..."
								/>
							)}
						</div>
						<div className="flex gap-4 mt-8">
							<Button
								type="submit"
								className="w-full"
								disabled={
									!name || !dateRange || !dateRange.from || !dateRange.to || !country || !city
								}
							>
								Crear evento
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
				</div>
			</form>
		</Modal>
	);
}