// src/auth/actions/check-auth.action.ts
import { boutiqueApi } from "@/api/BoutiqueApi";
import type { User } from "@/interfaces/user.interface";

export const checkAuthAction = async (): Promise<User> => {
    try {
        const { data } = await boutiqueApi.get<User>('/api/usuarios/me/');
        return data;
    } catch (error) {
        console.log('Error en checkAuthAction:', error)
        throw new Error('token no válido o expirado');
    }
}