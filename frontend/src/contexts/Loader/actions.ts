import { LoaderAction } from "./reducer";

export const showLoader = (dispatch: React.Dispatch<LoaderAction>) => {
    dispatch({ type: 'SHOW_LOADER' });
};

export const hideLoader = (dispatch: React.Dispatch<LoaderAction>) => {
    dispatch({ type: 'HIDE_LOADER' });
};
