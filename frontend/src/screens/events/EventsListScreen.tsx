
import { Link } from "react-router-dom";
// navigation
import { ROUTES } from "../../navigation/routes";
// components
import Button from "../../components/ui/Button";

export default function EventsListScreen(): JSX.Element {
	return (
		<section className="space-y-6 bg-slate-900 min-h-screen px-4 py-8">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold text-[#F5E427]">
						Eventos científicos
					</h1>
					<p className="text-slate-300">
						Administra los eventos, fechas, ubicaciones y sesiones.
					</p>
				</div>
				<Link to={ROUTES.eventCreate}>
					<Button>
						Crear evento
					</Button>
				</Link>
			</header>

			<div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/80 p-6 text-center">
				<p className="text-slate-200">
					Aún no hay eventos creados.
				</p>
				<p className="text-sm text-slate-400 mt-1">
					Cuando exista data, aquí mostraremos la lista.
				</p>
			</div>
		</section>
	);
}
