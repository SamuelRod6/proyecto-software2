import { ToastAction, ToastPayload } from "./reducer";

export const showToast = (
    dispatch: React.Dispatch<ToastAction>,
    payload: ToastPayload
) => {
    dispatch({ 
        type: "SHOW_TOAST", 
        payload 
    });
};
