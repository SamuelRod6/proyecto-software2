import axios from "axios";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  roleId?: number | null;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  roles: { id: number; name: string }[];
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface LoginResponsePayload {
    message: string;
    user: AuthUser;
    token: string;
}

export interface PasswordRecoveryRequestPayload {
  email: string;
}

export interface PasswordRecoveryVerifyPayload {
  email: string;
  temporaryKey: string;
}

export interface PasswordRecoveryResetPayload {
  email: string;
  temporaryKey: string;
  newPassword: string;
}

export async function registerUser(
    payload: RegisterPayload,
): Promise<{ status: number; data: any }> {
    try {
        const response = await axios.post("/api/auth/register", payload);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { message: "Error de red o desconocido" } };
    }
}

export async function loginUser(
    payload: LoginPayload,
): Promise<{ status: number; data: any }> {
    try {
        const response = await axios.post("/api/auth/login", payload);
        return { status: response.status, data: response.data };
    } catch (error: any) {
        if (error.response) {
            return { status: error.response.status, data: error.response.data };
        }
        return { status: 500, data: { message: "Error de red o desconocido" } };
    }
}

export async function requestPasswordRecovery(
  payload: PasswordRecoveryRequestPayload,
): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.post(
      "/api/auth/password-recovery/request",
      payload,
    );

    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { message: "Error de red o desconocido" } };
  }
}

export async function verifyPasswordRecovery(
  payload: PasswordRecoveryVerifyPayload,
): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.post(
      "/api/auth/password-recovery/verify",
      payload,
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { message: "Error de red o desconocido" } };
  }
}

export async function resetPasswordFromRecovery(
  payload: PasswordRecoveryResetPayload,
): Promise<{ status: number; data: any }> {
  try {
    const response = await axios.post(
      "/api/auth/password-recovery/reset",
      payload,
    );
    return { status: response.status, data: response.data };
  } catch (error: any) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data };
    }
    return { status: 500, data: { message: "Error de red o desconocido" } };
  }
}
