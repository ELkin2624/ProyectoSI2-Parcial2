import { boutiqueApi } from "@/api/BoutiqueApi";
import type { CarritoResponse } from "../interfaces/carrito.response.interface";

interface UpdateItemOptions {
    itemId: number;
    cantidad: number;
}

export const updateItemCartAction = async ({ itemId, cantidad }: UpdateItemOptions): Promise<CarritoResponse> => {
    const { data } = await boutiqueApi.patch<CarritoResponse>(`/carritos/items/${itemId}/`, {
        cantidad
    });

    return data;
}
