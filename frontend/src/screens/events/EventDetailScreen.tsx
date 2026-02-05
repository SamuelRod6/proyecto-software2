import { Link, useParams } from "react-router-dom";
// navigation
import { ROUTES } from "../../navigation/routes";

export default function EventDetailScreen(): JSX.Element {
	const { eventId } = useParams();

	return (
		<section className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-slate-900">
						Detalle del evento
					</h1>
					<p className="text-slate-600">ID: {eventId ?? "pendiente"}</p>
				</div>
				<Link
					to={ROUTES.events}
					className="text-sm font-medium text-yellow-800 hover:text-yellow-900"
				>
					Volver a eventos
				</Link>
			</div>
			<div className="rounded-xl border border-slate-200 bg-white p-6">
				<p className="text-slate-600">
					Detalle en construcción.
				</p>
			</div>
		</section>
	);
}
