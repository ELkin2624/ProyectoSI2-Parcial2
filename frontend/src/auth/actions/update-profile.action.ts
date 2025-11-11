import { boutiqueApi } from "@/api/BoutiqueApi";
import type { User } from "@/interfaces/user.interface";

export interface UpdateProfileData {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    email?: string;
}

/**
 * Actualiza la información del perfil del usuario actual
 */
export const updateProfileAction = async (profileData: UpdateProfileData): Promise<User> => {
    try {
        const { data } = await boutiqueApi.patch<User>('/usuarios/me/', profileData);
        return data;
    } catch (error: any) {
        console.error('Error al actualizar perfil:', error);
        throw error?.response?.data || error;
    }
};

/**
 * Cambia la contraseña del usuario actual
 */
export const changePasswordAction = async (
    old_password: string,
    new_password: string
): Promise<{ message: string }> => {
    try {
        const { data } = await boutiqueApi.post('/usuarios/change-password/', {
            old_password,
            new_password,
        });
        return data;
    } catch (error: any) {
        console.error('Error al cambiar contraseña:', error);
        throw error?.response?.data || error;
    }
};
