export type ToastStatus = 'success' | 'error' | 'info';

export interface ToastPayload {
    title: string;
    message: string;
    status: ToastStatus;
}

export type ToastAction = { 
    type: 'SHOW_TOAST'; 
    payload: ToastPayload 
};

export interface ToastState {
    toast: ToastPayload | null;
}

export const initialState: ToastState = {
    toast: null,
};

export function toastReducer(state: ToastState, action: ToastAction): ToastState {
    switch (action.type) {
        case 'SHOW_TOAST':
            return { toast: action.payload };
        default:
            return state;
    }
}
