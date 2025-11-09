import { boutiqueApi } from "@/api/BoutiqueApi";

export interface CreatePedidoData {
    direccion_id: number;
}

export interface DireccionEnvio {
    nombre_completo: string;
    calle_direccion: string;
    apartamento_direccion: string;
    ciudad: string;
    region_estado: string;
    pais: string;
    codigo_postal: string;
    telefono: string;
}

export interface PedidoItem {
    id: number;
    variante: {
        id: number;
        nombre: string;
        sku: string;
        imagen_url: string | null;
    };
    cantidad: number;
    precio_unitario: string;
    subtotal: string;
}

export interface PedidoResponse {
    id: string;
    usuario: number;
    email_cliente: string;
    estado: string;
    total_pedido: string;
    creado_en: string;
    direccion_envio: DireccionEnvio;
    items: PedidoItem[];
    pagos: any[];
}

/**
 * Crea un nuevo pedido a partir del carrito actual del usuario
 */
export const createPedidoAction = async (data: CreatePedidoData): Promise<PedidoResponse> => {
    console.log('📦 Creando pedido con datos:', data);
    try {
        const { data: response } = await boutiqueApi.post<PedidoResponse>('/pedidos/crear/', data);
        console.log('✅ Pedido creado:', response);
        return response;
    } catch (error: any) {
        console.error('❌ Error al crear pedido:', error?.response?.data);
        throw error;
    }
}

/**
 * Obtiene la lista de pedidos del usuario autenticado
 */
export const getMisPedidosAction = async (): Promise<PedidoResponse[]> => {
    const { data } = await boutiqueApi.get<PedidoResponse[]>('/pedidos/');
    return data;
}

/**
 * Obtiene el detalle de un pedido específico
 */
export const getPedidoByIdAction = async (pedidoId: string): Promise<PedidoResponse> => {
    const { data } = await boutiqueApi.get<PedidoResponse>(`/pedidos/${pedidoId}/`);
    return data;
}
