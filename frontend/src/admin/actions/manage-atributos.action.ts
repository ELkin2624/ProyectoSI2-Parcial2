import { boutiqueApi } from "@/api/BoutiqueApi";
import type { Atributo } from "@/interfaces/productos.interface";

export interface CreateAtributoData {
    nombre: string;
}

export const createAtributoAction = async (data: CreateAtributoData): Promise<Atributo> => {
    const { data: response } = await boutiqueApi.post<Atributo>(
        '/productos/admin/atributos/',
        data
    );
    return response;
};

export const updateAtributoAction = async (id: number, data: CreateAtributoData): Promise<Atributo> => {
    const { data: response } = await boutiqueApi.patch<Atributo>(
        `/productos/admin/atributos/${id}/`,
        data
    );
    return response;
};

export const deleteAtributoAction = async (id: number): Promise<void> => {
    await boutiqueApi.delete(`/productos/admin/atributos/${id}/`);
};
