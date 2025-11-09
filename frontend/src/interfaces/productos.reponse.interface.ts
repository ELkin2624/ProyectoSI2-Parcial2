import type { Productos } from "./productos.interface";

export interface ProductosResponse {
    count: number;
    next: string | null;  // URL de la página siguiente (si existe)
    previous: string | null;  // URL de la página anterior (si existe)
    results: Productos[];
}
