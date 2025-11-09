import { boutiqueApi } from "@/api/BoutiqueApi";

export interface ImagenProducto {
    id: number;
    producto: number;
    imagen: string;
    imagen_url: string;
    alt_text: string;
    es_principal: boolean;
}

/**
 * Sube una imagen al producto
 */
export const uploadProductImageAction = async (
    productoId: number,
    imageFile: File,
    esPrincipal: boolean = false
): Promise<ImagenProducto> => {
    const formData = new FormData();
    formData.append('producto', productoId.toString());
    formData.append('imagen', imageFile);
    formData.append('alt_text', imageFile.name || `Imagen de producto ${productoId}`);
    formData.append('es_principal', esPrincipal ? 'true' : 'false');

    // Log para debugging
    console.log('Subiendo imagen:', {
        productoId,
        fileName: imageFile.name,
        fileType: imageFile.type,
        fileSize: imageFile.size,
        esPrincipal
    });

    try {
        const { data } = await boutiqueApi.post<ImagenProducto>(
            '/productos/admin/imagenes/',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );

        console.log('Imagen subida exitosamente:', data);
        return data;
    } catch (error: any) {
        console.error('Error detallado subiendo imagen:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });
        throw error;
    }
};

/**
 * Sube múltiples imágenes al producto
 */
export const uploadProductImagesAction = async (
    productoId: number,
    imageFiles: File[]
): Promise<ImagenProducto[]> => {
    const uploadPromises = imageFiles.map((file, index) =>
        uploadProductImageAction(productoId, file, index === 0) // La primera es principal
    );

    return Promise.all(uploadPromises);
};

/**
 * Elimina una imagen del producto
 */
export const deleteProductImageAction = async (imagenId: number): Promise<void> => {
    await boutiqueApi.delete(`/productos/admin/imagenes/${imagenId}/`);
};
