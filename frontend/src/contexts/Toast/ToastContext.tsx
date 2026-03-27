import { createContext, useReducer, useContext, ReactNode, useEffect } from 'react';
import { toast } from 'react-toastify';
import { toastReducer, initialState, ToastPayload } from './reducer';
import { showToast as showToastAction } from './actions';
// components
import Toast from '../../components/ui/Toast';

interface ToastContextProps {
    showToast: (payload: ToastPayload) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(toastReducer, initialState);

    // Efecto para mostrar el toast cuando cambia el estado
    useEffect(() => {
        if (state.toast) {
            const { title, message, status } = state.toast;
            const content = title ? (
            <div>
                <div className="font-bold">{title}</div>
                <div className="mt-1">{message}</div>
            </div>
            ) : message;
            switch (status) {
                case 'success':
                    toast.success(content);
                    break;
                case 'error':
                    toast.error(content);
                    break;
                default:
                    toast.info(content);
            }
        }
    }, [state.toast]);

    const showToast = (payload: ToastPayload) => {
        showToastAction(dispatch, payload);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            <Toast />
            {children}
        </ToastContext.Provider>
    );
};

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
