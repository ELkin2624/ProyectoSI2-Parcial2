import { boutiqueApi } from "@/api/BoutiqueApi"
import type { ProductosResponse } from "@/interfaces/productos.reponse.interface";


interface Options {
    page?: number;
    page_size?: number;
    sizes?: string;
    gender?: string;
    minPrice?: number;
    maxPrice?: number;
    query?: string;
}


export const getProductsAction = async (options: Options): Promise<ProductosResponse> => {

    const { page, page_size, sizes, gender, maxPrice, minPrice, query } = options;



    const { data } = await boutiqueApi.get<ProductosResponse>('/productos/productos/', {
        params: {
            page,                  // Número de página (1, 2, 3...)
            page_size,             // Cantidad de items por página
            sizes,
            gender,
            minPrice,
            maxPrice,
            q: query
        }
    });


    return data

}
