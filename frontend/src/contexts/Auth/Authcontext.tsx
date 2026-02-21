import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { authReducer, initAuthState } from "./reducer";
import { login as loginAction, logout as logoutAction } from "./actions";

interface AuthContextValue {
    isAuthenticated: boolean;
    user: any;
    login: (user: any) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "auth-token";
const USER_KEY = "auth-user";

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
    const [state, dispatch] = useReducer(authReducer, undefined, initAuthState);

    // Sync auth state with localStorage
    useEffect(() => {
        if (!state.isAuthenticated) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(USER_KEY);
        } else if (state.user) {
            localStorage.setItem(USER_KEY, JSON.stringify(state.user));
        }
    }, [state.isAuthenticated, state.user]);

    // Memoize context value
    const value = useMemo<AuthContextValue>(
        () => ({
            isAuthenticated: state.isAuthenticated,
            user: state.user,
            login: (user: any) => {
                localStorage.setItem(USER_KEY, JSON.stringify(user));
                dispatch(loginAction(user));
            },
            logout: () => dispatch(logoutAction()),
        }),
        [state.isAuthenticated, state.user]
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