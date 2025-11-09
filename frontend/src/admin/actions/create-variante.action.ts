import { boutiqueApi } from "@/api/BoutiqueApi";
import type { Variante } from "@/interfaces/productos.interface";

export interface CreateVarianteData {
    producto: number;
    precio: string;
    precio_oferta?: string;
    stock_inicial?: number;
    activo: boolean;
    valores_ids: number[]; // IDs de ValorAtributo (ej: [1, 5] para "Talla: M", "Color: Azul")
}

export const createVarianteAction = async (
    varianteData: CreateVarianteData
): Promise<Variante> => {
    console.log('Creando variante con datos:', varianteData);

    try {
        const { data } = await boutiqueApi.post<Variante>(
            '/productos/admin/variantes/',
            varianteData
        );
        console.log('Variante creada exitosamente:', data);
        return data;
    } catch (error: any) {
        console.error('Error al crear variante:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });
        throw error;
    }
};

export const updateVarianteAction = async (
    varianteId: number,
    varianteData: Partial<CreateVarianteData>
): Promise<Variante> => {
    const { data } = await boutiqueApi.patch<Variante>(
        `/productos/admin/variantes/${varianteId}/`,
        varianteData
    );
    return data;
};

export const deleteVarianteAction = async (varianteId: number): Promise<void> => {
    await boutiqueApi.delete(`/productos/admin/variantes/${varianteId}/`);
};
