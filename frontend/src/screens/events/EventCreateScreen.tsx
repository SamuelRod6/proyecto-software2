import { Link } from "react-router-dom";
// navigation
import { ROUTES } from "../../navigation/routes";

export default function EventCreateScreen(): JSX.Element {
	return (
		<section className="space-y-4 bg-slate-900 min-h-screen px-4 py-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-[#F5E427]">
						Crear evento
					</h1>
					<p className="text-slate-300">
						Completa los datos básicos del evento científico.
					</p>
				</div>
				<Link
					to={ROUTES.events}
					className="text-sm font-medium text-[#F5E427] hover:text-[#E6D51E]"
				>
					Volver a eventos
				</Link>
			</div>
			<div className="rounded-xl border border-slate-700 bg-slate-800/80 p-6">
				<p className="text-slate-200">
					Formulario en construcción.
				</p>
			</div>
		</section>
	);
}
