import { boutiqueApi } from "@/api/BoutiqueApi";
import type { Valore } from "@/interfaces/productos.interface";

export interface CreateValorAtributoData {
    atributo: number;
    valor: string;
}

export const createValorAtributoAction = async (data: CreateValorAtributoData): Promise<Valore> => {
    const { data: response } = await boutiqueApi.post<Valore>(
        '/productos/admin/valores/',
        data
    );
    return response;
};

export const updateValorAtributoAction = async (id: number, data: Partial<CreateValorAtributoData>): Promise<Valore> => {
    const { data: response } = await boutiqueApi.patch<Valore>(
        `/productos/admin/valores/${id}/`,
        data
    );
    return response;
};

export const deleteValorAtributoAction = async (id: number): Promise<void> => {
    await boutiqueApi.delete(`/productos/admin/valores/${id}/`);
};
