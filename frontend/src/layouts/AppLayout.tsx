import { Outlet } from "react-router-dom";
// components
import Sidebar from "../components/ui/Sidebar";
import Header from "../components/ui/Header";

export default function AppLayout(): JSX.Element {
	return (
		<div className="min-h-screen bg-slate-900">
			<div className="flex min-h-screen">
				<Sidebar />
				<div className="flex flex-1 flex-col">
					<Header />
					<main className="flex-1 px-6 py-6">
						<Outlet />
					</main>
				</div>
			</div>
		</div>
	);
}
