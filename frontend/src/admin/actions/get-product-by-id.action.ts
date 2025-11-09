import { boutiqueApi } from "@/api/BoutiqueApi";
import type { Productos } from "@/interfaces/productos.interface";



export const getProductByIdAction = async (slug: string): Promise<Productos> => {

    if (!slug) throw new Error('Slug is required');

    if (slug === 'new') {
        return {
            id: 0,
            nombre: '',
            slug: '',
            descripcion: '',
            activo: true,
            creado_en: new Date(),
            actualizado_en: new Date(),
            categoria: {
                id: 0,
                nombre: '',
                slug: '',
                padre: 0,
                descripcion: '',
                imagen_url: null,
                hijos: []
            },
            atributos: [],
            imagenes_galeria: [],
            variantes: []
        } as Productos
    }

    try {
        // Siempre usar el endpoint público que funciona correctamente con slug
        // y devuelve todas las variantes con su stock
        const endpoint = `/productos/productos/${slug}/`;
        console.log('Cargando producto desde:', endpoint);

        const { data } = await boutiqueApi.get<Productos>(endpoint);
        console.log('Producto cargado:', {
            nombre: data.nombre,
            variantes: data.variantes?.length || 0,
            atributos: data.atributos?.length || 0
        });

        // Log detallado de las variantes
        if (data.variantes && data.variantes.length > 0) {
            console.log('Variantes detalle:', data.variantes.map(v => ({
                id: v.id,
                sku: v.sku,
                precio: v.precio,
                stock_total: v.stock_total,
                valores: v.valores?.map(val => `${val.atributo.nombre}: ${val.valor}`).join(', ')
            })));
        } else {
            console.warn('⚠️ El producto no tiene variantes o el array está vacío');
        }

        return data;
    } catch (error) {
        console.error('Error al obtener producto:', error);
        throw error;
    }

}