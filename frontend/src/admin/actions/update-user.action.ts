import { boutiqueApi } from "@/api/BoutiqueApi";
import type { UpdateUserData, User } from "@/interfaces/user.response.interface";

export const updateUserAction = async (userId: number, userData: UpdateUserData): Promise<User> => {
    try {
        const { data } = await boutiqueApi.patch<User>(`/usuarios/admin/usuarios/${userId}/`, userData);
        return data;
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        throw error;
    }
};
