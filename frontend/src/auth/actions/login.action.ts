// src/auth/actions/login.action.ts
import { boutiqueApi } from "@/api/BoutiqueApi"
import type { AuthResponse } from "../interfaces/auth.response";

export const loginAction = async (email: string, password: string): Promise<AuthResponse> => {
    try {
        const { data } = await boutiqueApi.post<AuthResponse>('/api/token/', {
            email,
            password
        })
        return data;

    } catch (error) {
        console.error('Error en loginAction: ', error);
        throw error;
    }
}