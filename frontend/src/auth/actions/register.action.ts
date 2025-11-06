// src/auth/actions/register.action.ts
import { boutiqueApi } from "@/api/BoutiqueApi"
import type { User } from "@/interfaces/user.interface";

const splitFullName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    const first_name = parts[0] || '';
    const last_name = parts.slice(1).join(' ') || ''; 
    return { first_name, last_name };
}

export const registerAction = async (email: string, password: string, fullName: string): Promise<User> => {
    try {
        const { first_name, last_name } = splitFullName(fullName);
        const { data } = await boutiqueApi.post<User>('/api/usuarios/registro/', {
            email,
            password,
            password2: password, 
            first_name,
            last_name
        });
        return data;
    } catch (error: any) {
        console.error('Error en registerAction: ', error.response?.data || error);
        throw error;
    }
}