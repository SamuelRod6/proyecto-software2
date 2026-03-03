export interface LoaderState {
    visible: boolean;
}

export const initialState: LoaderState = {
    visible: false,
};

export type LoaderAction = 
    { type: 'SHOW_LOADER' } | { type: 'HIDE_LOADER' };

export function loaderReducer(
    state: LoaderState, 
    action: LoaderAction
): LoaderState {
    switch (action.type) {
        case 'SHOW_LOADER':
            return { visible: true };
        case 'HIDE_LOADER':
            return { visible: false };
        default:
            return state;
    }
}
