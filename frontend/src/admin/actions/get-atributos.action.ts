import { boutiqueApi } from "@/api/BoutiqueApi";
import type { Atributo } from "@/interfaces/productos.interface";

export const getAtributosAction = async (): Promise<Atributo[]> => {
    const { data } = await boutiqueApi.get<Atributo[]>('/productos/admin/atributos/');
    return data;
};
