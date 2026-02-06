import { Outlet } from "react-router-dom";
// components
import Sidebar from "../components/ui/Sidebar";
import Header from "../components/ui/Header";
import Loader from "../components/ui/Loader";
import Toast from "../components/ui/Toast";
// contexts
import { useLoader } from "../contexts/Loader/LoaderContext";

export default function AppLayout(): JSX.Element {
	const { state: loaderState } = useLoader();
	return (
		<div className="min-h-screen bg-slate-900">
			<Toast />
			{loaderState.visible && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
					<Loader visible={true} />
				</div>
			)}
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
