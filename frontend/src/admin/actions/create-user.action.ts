import { boutiqueApi } from "@/api/BoutiqueApi";
import type { CreateUserData, User } from "@/interfaces/user.response.interface";

export const createUserAction = async (userData: CreateUserData): Promise<User> => {
    try {
        const { data } = await boutiqueApi.post<User>('/usuarios/admin/usuarios/', userData);
        return data;
    } catch (error) {
        console.error('Error al crear usuario:', error);
        throw error;
    }
};
