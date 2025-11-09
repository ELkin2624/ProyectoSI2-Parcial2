
export interface Item {
    id: number;
    variante: Variante;
    cantidad: number;
    precio_final: string;
    subtotal: string;
}

export interface Variante {
    id: number;
    nombre: string;
    sku: string;
    imagen_url: null;
}
