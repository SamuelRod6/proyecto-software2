import { Link } from "react-router-dom";
// navigation
import { ROUTES } from "../navigation/routes";

export default function HomeScreen(): JSX.Element {
	return (
		<section className="min-h-screen h-full bg-slate-900 text-white flex flex-col items-center justify-center px-4">
			<h1 className="text-4xl font-bold mb-4 text-[#F5E427] drop-shadow">
				Bienvenido al Home
			</h1>
			<p className="text-lg text-slate-300 mb-8">
				Esta es la pantalla principal de la aplicación.
			</p>
			<div className="rounded-xl bg-slate-800/80 p-6 shadow-lg max-w-lg w-full mb-6 flex flex-col items-center text-center">
				<p className="text-slate-200">
					Esta es una vista temporal de la pantalla de inicio. Por favor, navega a la sección de eventos para ver la funcionalidad principal de la aplicación.
				</p>
				<Link
					to={ROUTES.events}
					className="mt-6 inline-flex items-center rounded-md bg-[#F5E427] px-6 py-2 text-base font-semibold text-slate-900 hover:bg-[#E6D51E] transition-colors shadow"
				>
					Ir a eventos
				</Link>
			</div>
		</section>
	);
}
