export const LOGIN = "AUTH/LOGIN" as const;
export const LOGOUT = "AUTH/LOGOUT" as const;

export type AuthAction =
    | { type: typeof LOGIN }
    | { type: typeof LOGOUT };

export const login = (): AuthAction => ({ type: LOGIN });
export const logout = (): AuthAction => ({ type: LOGOUT });