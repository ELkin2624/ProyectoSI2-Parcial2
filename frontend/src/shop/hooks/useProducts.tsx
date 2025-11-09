import { useQuery } from "@tanstack/react-query";
import { getProductsAction } from "../actions/get-products.actions";
import { useSearchParams } from "react-router";

export const useProducts = () => {

    const [searchParams] = useSearchParams();

    const page_size = Number(searchParams.get('page_size')) || 12;
    const page = Number(searchParams.get('page')) || 1;  // ⭐ Capturar el parámetro 'page'



    return useQuery({
        queryKey: ['products', { page, page_size }],
        queryFn: () => getProductsAction({
            page,           // ⭐ Pasar el número de página
            page_size
        }),
        staleTime: 1000 * 60 * 5,
    });
}
