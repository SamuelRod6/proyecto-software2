import type { AuthAction } from "./actions";
import { LOGIN, LOGOUT } from "./actions";

export type User = {
    id: number;
    name: string;
    email: string;
    role: string;
} | null;

export type AuthState = {
    isAuthenticated: boolean;
    user: User;
};

export const initAuthState = (): AuthState => {
    const token = localStorage.getItem('auth-token');
    const userStr = localStorage.getItem('auth-user');

    let user: User = null;
    if (userStr) {
        try { user = JSON.parse(userStr); } catch { user = null; }
    }

    return {
        isAuthenticated: !!token,
        user,
    };
};

export function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case LOGIN:
            return { ...state, isAuthenticated: true, user: action.payload };
        case LOGOUT:
            return { ...state, isAuthenticated: false, user: null };
        default:
            return state;
    }
}