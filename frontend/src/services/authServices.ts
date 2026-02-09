import axios from "axios";

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    roleId: number | null;
}

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
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
