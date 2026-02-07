import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { authReducer, initAuthState } from "./reducer";
import { login as loginAction, logout as logoutAction } from "./actions";

interface AuthContextValue {
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "auth-demo";

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
    const [state, dispatch] = useReducer(
        authReducer,
        false,
        () => initAuthState(localStorage.getItem(STORAGE_KEY) === "true")
    );

    // Sync auth state with localStorage
    useEffect(() => {
        if (state.isAuthenticated) {
            localStorage.setItem(STORAGE_KEY, "true");
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [state.isAuthenticated]);

    // Memoize context value
    const value = useMemo<AuthContextValue>(
        () => ({
            isAuthenticated: state.isAuthenticated,
            login: () => dispatch(loginAction()),
            logout: () => dispatch(logoutAction()),
        }),
        [state.isAuthenticated]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}