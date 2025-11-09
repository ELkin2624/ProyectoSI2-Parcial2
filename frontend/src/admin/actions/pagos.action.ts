import { boutiqueApi } from "@/api/BoutiqueApi";

export interface Usuario {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
}

export interface Pago {
    id: number;
    pedido: {
        id: number;
        usuario: Usuario;
        total: string;
    };
    metodo_pago: 'STRIPE' | 'PAYPAL' | 'QR_MANUAL';
    estado: 'PENDIENTE' | 'COMPLETADO' | 'FALLIDO';
    monto: string;
    stripe_payment_intent_id?: string;
    paypal_order_id?: string;
    qr_comprobante?: string;
    created_at: string;
    updated_at: string;
}

export interface CreatePagoData {
    pedido_id: number;
    metodo_pago: string;
    monto?: string;
    estado: string;
}

/**
 * Obtiene todos los pagos (admin)
 * Endpoint según documentación: GET /api/pagos/admin/
 */
export const getPagosAction = async (): Promise<Pago[]> => {
    try {
        const { data } = await boutiqueApi.get('/pagos/admin/');
        return data;
    } catch (error) {
        console.error('Error al obtener pagos:', error);
        throw error;
    }
};

/**
 * Obtiene un pago por ID
 * Endpoint: GET /api/pagos/admin/{id}/
 */
export const getPagoByIdAction = async (id: number): Promise<Pago> => {
    try {
        const { data } = await boutiqueApi.get(`/pagos/admin/${id}/`);
        return data;
    } catch (error) {
        console.error('Error al obtener pago:', error);
        throw error;
    }
};

/**
 * Crea un nuevo pago (admin)
 * Endpoint: POST /api/pagos/admin/
 */
export const createPagoAction = async (pagoData: CreatePagoData): Promise<Pago> => {
    try {
        const { data } = await boutiqueApi.post('/pagos/admin/', pagoData);
        return data;
    } catch (error) {
        console.error('Error al crear pago:', error);
        throw error;
    }
};

/**
 * Aprueba un pago (cambia estado a COMPLETADO)
 * Endpoint: PATCH /api/pagos/admin/{id}/
 */
export const approvePagoAction = async (id: number): Promise<Pago> => {
    try {
        const { data } = await boutiqueApi.patch(`/pagos/admin/${id}/`, {
            estado: 'COMPLETADO'
        });
        return data;
    } catch (error) {
        console.error('Error al aprobar pago:', error);
        throw error;
    }
};

/**
 * Rechaza un pago (cambia estado a FALLIDO)
 * Endpoint: PATCH /api/pagos/admin/{id}/
 */
export const rejectPagoAction = async (id: number): Promise<Pago> => {
    try {
        const { data } = await boutiqueApi.patch(`/pagos/admin/${id}/`, {
            estado: 'FALLIDO'
        });
        return data;
    } catch (error) {
        console.error('Error al rechazar pago:', error);
        throw error;
    }
};
