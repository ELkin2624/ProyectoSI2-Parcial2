import { useQuery } from "@tanstack/react-query";
import { getProductsAction } from "../actions/get-products.actions";
import { useParams, useSearchParams } from "react-router";

export const useProducts = () => {

    const [searchParams] = useSearchParams();

    const limit = searchParams.get('limit') || 9;
    const page = searchParams.get('page') || 1;
    const sizes = searchParams.get('sizes') || undefined;
    const { gender } = useParams();


    const price = searchParams.get('price') || 'any';

    let minPrice = undefined;
    let maxPrice = undefined;

    switch (price) {
        case 'any':
            break;
        case '0-50':
            minPrice = 0;
            maxPrice = 50;
            break;
        case '50-100':
            minPrice = 50;
            maxPrice = 100;
            break;
        case '100-200':
            minPrice = 100;
            maxPrice = 200;
            break;
        case '200+':
            minPrice = 200;
            maxPrice = undefined;
            break;
    }


    const query = searchParams.get('query') || undefined;


    const offset = (Number(page) - 1) * Number(limit);

    return useQuery({
        queryKey: ['products', { offset, limit, sizes, gender, minPrice, maxPrice, query }],
        queryFn: () => getProductsAction({
            limit: isNaN(+limit) ? 9 : limit,
            offset: isNaN(offset) ? 0 : offset,
            sizes,
            gender,
            minPrice,
            maxPrice,
            query
        }),
        staleTime: 1000 * 60 * 5,
    });
}
