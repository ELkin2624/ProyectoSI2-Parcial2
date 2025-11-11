import { boutiqueApi } from "@/api/BoutiqueApi";
import type { Categoria } from "@/interfaces/productos.interface";

interface PaginatedCategoriesResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Categoria[];
}

export const getCategoriesAction = async (): Promise<Categoria[]> => {
    try {
        const { data } = await boutiqueApi.get<PaginatedCategoriesResponse>('/productos/categorias/', {
            params: { page_size: 1000 } // Traer todas las categorías
        });
        return data.results;
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        throw error;
    }
};
