import { boutiqueApi } from "@/api/BoutiqueApi";

export interface Address {
    id: number;
    user: number;
    address_type: 'SHIPPING' | 'BILLING';
    street_address: string;
    apartment_address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateAddressData {
    address_type: 'SHIPPING' | 'BILLING';
    street_address: string;
    apartment_address?: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    is_default?: boolean;
}

/**
 * Obtiene todas las direcciones del usuario autenticado
 */
export const getMyAddressesAction = async (): Promise<Address[]> => {
    try {
        console.log('🔍 Obteniendo direcciones del usuario...');
        const { data } = await boutiqueApi.get<any>('/usuarios/me/addresses/');
        console.log('✅ Direcciones obtenidas:', data);

        // El backend devuelve paginación: {count, next, previous, results}
        if (data && data.results && Array.isArray(data.results)) {
            return data.results;
        }

        // Si viene un array directo (sin paginación)
        if (Array.isArray(data)) {
            return data;
        }

        return [];
    } catch (error) {
        console.error('❌ Error al obtener direcciones:', error);
        return [];
    }
}

/**
 * Crea una nueva dirección para el usuario autenticado
 */
export const createAddressAction = async (addressData: CreateAddressData): Promise<Address> => {
    // Limpiar campos opcionales vacíos
    const cleanData = { ...addressData };
    if (!cleanData.apartment_address) {
        delete cleanData.apartment_address;
    }
    if (cleanData.is_default === undefined) {
        cleanData.is_default = false;
    }

    console.log('📍 Enviando dirección:', cleanData);
    const { data } = await boutiqueApi.post<Address>('/usuarios/me/addresses/', cleanData);
    console.log('✅ Dirección creada:', data);
    return data;
}

/**
 * Obtiene una dirección específica
 */
export const getAddressByIdAction = async (addressId: number): Promise<Address> => {
    const { data } = await boutiqueApi.get<Address>(`/usuarios/me/addresses/${addressId}/`);
    return data;
}

/**
 * Actualiza una dirección existente
 */
export const updateAddressAction = async (addressId: number, addressData: Partial<CreateAddressData>): Promise<Address> => {
    // Limpiar campos opcionales vacíos
    const cleanData = { ...addressData };
    if (!cleanData.apartment_address) {
        delete cleanData.apartment_address;
    }

    const { data } = await boutiqueApi.patch<Address>(`/usuarios/me/addresses/${addressId}/`, cleanData);
    return data;
}

/**
 * Elimina una dirección
 */
export const deleteAddressAction = async (addressId: number): Promise<void> => {
    await boutiqueApi.delete(`/usuarios/me/addresses/${addressId}/`);
}
