import { boutiqueApi } from "@/api/BoutiqueApi";
import type { User } from "@/interfaces/user.response.interface";

export const getUserByIdAction = async (userId: number): Promise<User> => {
    try {
        const { data } = await boutiqueApi.get<User>(`/usuarios/admin/usuarios/${userId}/`);

        return data;
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        throw error;
    }
};
