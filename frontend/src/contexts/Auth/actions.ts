export const LOGIN = "AUTH/LOGIN" as const;
export const LOGOUT = "AUTH/LOGOUT" as const;

export type AuthAction =
    | { type: typeof LOGIN, payload: any }
    | { type: typeof LOGOUT };

export const login = (user: any): AuthAction => ({ type: LOGIN, payload: user });
export const logout = (): AuthAction => ({ type: LOGOUT });