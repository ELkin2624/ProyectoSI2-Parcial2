import { boutiqueApi } from "@/api/BoutiqueApi";
import type { Productos } from "@/interfaces/productos.interface";

export const updateProductoAtributosAction = async (
    productoId: number,
    atributosIds: number[]
): Promise<Productos> => {
    console.log('🔧 Actualizando atributos del producto:', {
        productoId,
        atributosIds,
        payload: { atributos_ids: atributosIds }
    });

    const { data } = await boutiqueApi.patch<Productos>(
        `/productos/admin/productos/${productoId}/`,
        {
            atributos_ids: atributosIds
        }
    );

    console.log('✅ Respuesta del servidor:', {
        nombre: data.nombre,
        atributos: data.atributos,
        atributosCount: data.atributos?.length || 0
    });

    return data;
};
