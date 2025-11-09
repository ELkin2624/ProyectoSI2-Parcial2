import { boutiqueApi } from "@/api/BoutiqueApi";

export const deleteUserAction = async (userId: number): Promise<void> => {
    try {
        await boutiqueApi.delete(`/usuarios/admin/usuarios/${userId}/`);
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        throw error;
    }
};
