import { boutiqueApi } from "@/api/BoutiqueApi";
import type { CarritoResponse } from "../interfaces/carrito.response.interface";

export const deleteItemCartAction = async (itemId: number): Promise<CarritoResponse> => {
    const { data } = await boutiqueApi.delete<CarritoResponse>(`/carritos/items/${itemId}/`);

    return data;
}
