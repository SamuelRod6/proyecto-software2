import AppRouter from "./navigation/AppRouter";
// contexts
import { LoaderProvider } from "./contexts/Loader/LoaderContext";
import { ToastProvider } from "./contexts/Toast/ToastContext";

export default function App(): JSX.Element {
	return (
		<ToastProvider>
			<LoaderProvider>
				<AppRouter />
			</LoaderProvider>
		</ToastProvider>
	);
}
