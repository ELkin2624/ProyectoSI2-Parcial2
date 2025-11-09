import { boutiqueApi } from "@/api/BoutiqueApi";

export interface Pago {
    id: string;
    pedido: string;
    monto: string;
    metodo_pago: string;
    estado: string;
    id_transaccion_pasarela: string | null;
    comprobante_qr_url: string | null;
    creado_en: string;
    actualizado_en: string;
}

export interface CreatePagoData {
    pedido_id: string;
    metodo_pago: 'STRIPE' | 'QR_MANUAL';
}

export interface PagoStripeResponse {
    client_secret: string;
    pago_id: string;
    payment_intent_id: string;
}

export interface PagoQRResponse extends Pago { }

/**
 * Crea un nuevo pago para un pedido
 */
export const createPagoAction = async (data: CreatePagoData): Promise<PagoStripeResponse | PagoQRResponse> => {
    console.log('💳 Creando pago:', data);
    const response = await boutiqueApi.post<PagoStripeResponse | PagoQRResponse>('/pagos/crear/', data);
    console.log('✅ Pago creado:', response.data);
    return response.data;
}

/**
 * Sube el comprobante de pago QR
 */
export const uploadQRComprobanteAction = async (pagoId: string, file: File): Promise<Pago> => {
    const formData = new FormData();
    formData.append('comprobante_qr', file);

    console.log('📤 Subiendo comprobante QR para pago:', pagoId);
    const { data } = await boutiqueApi.patch<Pago>(`/pagos/${pagoId}/upload-qr/`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    console.log('✅ Comprobante subido:', data);
    return data;
}

/**
 * Obtiene los detalles de un pago específico
 */
export const getPagoByIdAction = async (pagoId: string): Promise<Pago> => {
    const { data } = await boutiqueApi.get<Pago>(`/pagos/${pagoId}/`);
    return data;
}

/**
 * Confirma un pago de Stripe (para desarrollo local)
 */
export const confirmarPagoStripeAction = async (pagoId: string, paymentIntentId: string): Promise<{ detail: string }> => {
    console.log('✅ Confirmando pago Stripe:', { pagoId, paymentIntentId });
    const { data } = await boutiqueApi.post<{ detail: string }>('/pagos/confirmar-stripe/', {
        pago_id: pagoId,
        payment_intent_id: paymentIntentId,
    });
    console.log('✅ Pago confirmado:', data);
    return data;
}
