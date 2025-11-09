import { boutiqueApi } from "@/api/BoutiqueApi";
import type { CarritoResponse } from "../interfaces/carrito.response.interface";



export const getCarritoAction = async (): Promise<CarritoResponse> => {


    const { data } = await boutiqueApi.get<CarritoResponse>('/carritos/');


    return data
}
