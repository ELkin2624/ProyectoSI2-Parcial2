import { boutiqueApi } from "@/api/BoutiqueApi";
import type { CarritoResponse } from "../interfaces/carrito.response.interface";


interface Options {
    variante_id: number;
    cantidad: number;
}

export const CreateItemCartAction = async (options: Options): Promise<CarritoResponse> => {

    const { cantidad, variante_id } = options

    const { data } = await boutiqueApi.post<CarritoResponse>('/carritos/items/', {
        variante_id,
        cantidad
    });

    return data;
}
