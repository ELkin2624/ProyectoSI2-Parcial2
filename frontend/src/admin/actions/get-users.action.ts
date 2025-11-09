import { boutiqueApi } from "@/api/BoutiqueApi";
import type { UsersResponse } from "@/interfaces/user.response.interface";

interface Options {
    page?: number;
    page_size?: number;
}

export const getUsersAction = async (options: Options = {}): Promise<UsersResponse> => {
    const { page = 1, page_size = 10 } = options;

    try {
        const { data } = await boutiqueApi.get('/usuarios/admin/usuarios/', {
            params: {
                page,
                page_size
            }
        });

        console.log({ data })

        // Si el backend retorna un array directo, lo convertimos al formato esperado
        if (Array.isArray(data)) {
            return {
                count: data.length,
                next: null,
                previous: null,
                results: data
            };
        }

        // Si ya viene con la estructura de paginación, lo retornamos tal cual
        return data as UsersResponse;
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        throw error;
    }
};
