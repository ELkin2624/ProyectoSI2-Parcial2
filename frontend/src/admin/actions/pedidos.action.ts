import { boutiqueApi } from "@/api/BoutiqueApi";

export interface Direccion {
    id: number;
    calle: string;
    ciudad: string;
    estado: string;
    codigo_postal: string;
    pais: string;
}

export interface Usuario {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
}

export interface DetallePedido {
    id: number;
    variante: {
        id: number;
        nombre: string;  // Nombre del producto (viene de producto.nombre en el serializer)
        sku: string;
        imagen_url?: string;
    };
    cantidad: number;
    precio_unitario: string;
    subtotal: string;
}

export interface Pedido {
    id: string;
    usuario: Usuario;
    email_cliente: string;
    estado: 'PENDIENTE' | 'EN_VERIFICACION' | 'PAGADO' | 'EN_PREPARACION' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
    direccion_envio: Direccion;
    total_pedido: string;
    creado_en: string;
    actualizado_en: string;
    items: DetallePedido[];
}

export interface PaginatedPedidosResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Pedido[];
}

/**
 * Obtiene todos los pedidos (admin) con paginación
 * Endpoint según documentación: GET /api/pedidos/admin/?page=1
 */
export const getPedidosAction = async (page: number = 1): Promise<PaginatedPedidosResponse> => {
    try {
        const { data } = await boutiqueApi.get<PaginatedPedidosResponse>(`/pedidos/admin/?page=${page}`);
        return data;
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        throw error;
    }
};

/**
 * Obtiene un pedido por ID
 * Endpoint: GET /api/pedidos/admin/{id}/
 */
export const getPedidoByIdAction = async (id: string): Promise<Pedido> => {
    try {
        const { data } = await boutiqueApi.get(`/pedidos/admin/${id}/`);
        return data;
    } catch (error) {
        console.error('Error al obtener pedido:', error);
        throw error;
    }
};

/**
 * Actualiza el estado de un pedido
 * Endpoint: PATCH /api/pedidos/admin/{id}/
 * Estados válidos: PENDIENTE, EN_VERIFICACION, PAGADO, EN_PREPARACION, ENVIADO, ENTREGADO, CANCELADO
 */
export const updatePedidoEstadoAction = async (
    id: string,
    estado: Pedido['estado']
): Promise<Pedido> => {
    try {
        const { data } = await boutiqueApi.patch(`/pedidos/admin/${id}/`, {
            estado
        });
        return data;
    } catch (error) {
        console.error('Error al actualizar estado del pedido:', error);
        throw error;
    }
};
