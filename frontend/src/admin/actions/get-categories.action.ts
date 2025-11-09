import { boutiqueApi } from "@/api/BoutiqueApi";
import type { Categoria } from "@/interfaces/productos.interface";

export const getCategoriesAction = async (): Promise<Categoria[]> => {
    try {
        const { data } = await boutiqueApi.get<Categoria[]>('/productos/categorias/');
        return data;
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        throw error;
    }
};
