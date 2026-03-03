import { createContext, useReducer, useContext, ReactNode } from 'react';
import { loaderReducer, initialState, LoaderState } from './reducer';

interface LoaderContextProps {
    state: LoaderState;
    showLoader: () => void;
    hideLoader: () => void;
}

const LoaderContext = createContext<LoaderContextProps | undefined>(undefined);

export const LoaderProvider = ({ children }: { children: ReactNode }) => {

    const [state, dispatch] = useReducer(loaderReducer, initialState);

    const showLoader = () => 
        dispatch({ type: 'SHOW_LOADER' });

    const hideLoader = () => 
        dispatch({ type: 'HIDE_LOADER' });

    return (
        <LoaderContext.Provider value={{ state, showLoader, hideLoader }}>
            {children}
        </LoaderContext.Provider>
    );
};

export function useLoader() {
    const context = useContext(LoaderContext);

    if (!context) {
        throw new Error('useLoader must be used within a LoaderProvider');
    }
    return context;
}