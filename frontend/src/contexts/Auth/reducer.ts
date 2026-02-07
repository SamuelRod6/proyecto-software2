import type { AuthAction } from "./actions";
import { LOGIN, LOGOUT } from "./actions";

export type AuthState = {
    isAuthenticated: boolean;
};

export const initAuthState = (isAuthenticated: boolean): AuthState => ({
    isAuthenticated,
});

export function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case LOGIN:
            return { ...state, isAuthenticated: true };
        case LOGOUT:
            return { ...state, isAuthenticated: false };
        default:
            return state;
    }
}