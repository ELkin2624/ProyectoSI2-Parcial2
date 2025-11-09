import { boutiqueApi } from "@/api/BoutiqueApi";
import type { Productos } from "@/interfaces/productos.interface";
import { uploadProductImagesAction, deleteProductImageAction } from "./upload-product-images.action";

export interface CreateUpdateProductData {
    nombre: string;
    descripcion: string;
    categoria: number;
    activo: boolean;
    imagenes?: File[];
    imagenes_urls?: string[]; // URLs de imágenes existentes a mantener
}

export const createUpdateProductAction = async (
    slug: string | number,
    productData: CreateUpdateProductData
): Promise<Productos> => {

    const isCreating = slug === 'new' || slug === 0;

    try {
        // 1. Crear o actualizar el producto base (sin imágenes)
        const productPayload = {
            nombre: productData.nombre,
            descripcion: productData.descripcion,
            categoria_id: productData.categoria,
            activo: productData.activo,
            atributos_ids: [] // Array vacío por defecto, los atributos se configuran en Django admin
        };

        let producto: Productos;

        console.log('Enviando payload al backend:', productPayload);
        console.log('Es creación:', isCreating);

        if (isCreating) {
            // Crear nuevo producto
            try {
                const { data } = await boutiqueApi.post<Productos>(
                    '/productos/admin/productos/',
                    productPayload
                );
                console.log('Producto creado exitosamente:', data);
                producto = data;
            } catch (error: any) {
                console.error('Error creando producto - Detalles completos:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    payload: productPayload
                });
                throw error;
            }
        } else {
            // Actualizar producto existente
            const productResponse = await boutiqueApi.get<Productos>(`/productos/productos/${slug}/`);
            const productId = productResponse.data.id;

            const { data } = await boutiqueApi.patch<Productos>(
                `/productos/admin/productos/${productId}/`,
                productPayload
            );
            producto = data;
        }

        // 2. Gestionar las imágenes si hay cambios
        if (!isCreating && productData.imagenes_urls !== undefined) {
            // Eliminar imágenes que ya no están en imagenes_urls
            const currentImages = producto.imagenes_galeria || [];
            const imagesToDelete = currentImages.filter((img: any) =>
                !productData.imagenes_urls?.includes(img.imagen_url || img.imagen)
            );

            // Eliminar imágenes que el usuario quitó
            for (const img of imagesToDelete) {
                try {
                    await deleteProductImageAction(img.id);
                } catch (error) {
                    console.error(`Error eliminando imagen ${img.id}:`, error);
                }
            }
        }

        // 3. Subir nuevas imágenes si hay
        if (productData.imagenes && productData.imagenes.length > 0) {
            console.log(`Subiendo ${productData.imagenes.length} imágenes al producto ID: ${producto.id}`);
            try {
                const uploadedImages = await uploadProductImagesAction(producto.id, productData.imagenes);
                console.log(`Imágenes subidas exitosamente:`, uploadedImages);
            } catch (error: any) {
                console.error('Error subiendo imágenes:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
                // Lanzar el error para que el usuario lo vea
                throw new Error(`Error al subir imágenes: ${error.response?.data?.detail || error.message}`);
            }
        }

        // 4. Recargar el producto completo con las imágenes actualizadas
        const { data: updatedProduct } = await boutiqueApi.get<Productos>(
            `/productos/productos/${producto.slug}/`
        );

        return updatedProduct;

    } catch (error) {
        console.error('Error al crear/actualizar producto:', error);
        throw error;
    }
};