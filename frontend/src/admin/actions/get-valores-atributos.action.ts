import { boutiqueApi } from "@/api/BoutiqueApi";
import type { Valore } from "@/interfaces/productos.interface";

export const getValoresAtributosAction = async (): Promise<Valore[]> => {
    const { data } = await boutiqueApi.get<Valore[]>('/productos/admin/valores/');
    return data;
};
