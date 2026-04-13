import AppRouter from "./navigation/AppRouter";
// contexts
import { LoaderProvider } from "./contexts/Loader/LoaderContext";
import { ToastProvider } from "./contexts/Toast/ToastContext";
import { ModalProvider } from "./contexts/Modal/ModalContext";

export default function App(): JSX.Element {
	return (
		<ToastProvider>
			<LoaderProvider>
				<ModalProvider>
					<AppRouter />
				</ModalProvider>
			</LoaderProvider>
		</ToastProvider>
	);
}
