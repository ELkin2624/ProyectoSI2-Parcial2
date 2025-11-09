import type { Item } from "./item.carrito.interface";

export interface CarritoResponse {
    id: string;
    usuario: number;
    session_key: null;
    items: Item[];
    total_carrito: string;
}
