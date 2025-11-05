import { createUpdateProductAction } from "@/admin/actions/create-update-product.action"
import { getProductByIdAction } from "@/admin/actions/get-product-by-id.action"
import type { Product } from "@/interfaces/product.interface"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"



export const useProduct = (id: string) => {

    const queryClient = useQueryClient();


    const query = useQuery({
        queryKey: ['product', { id }],
        queryFn: () => getProductByIdAction(id),
        retry: false,
        staleTime: 1000 * 60 * 5, //5minutos
        // enabled: !!id
    })

    const mutation = useMutation({
        mutationFn: createUpdateProductAction,
        onSuccess: (product: Product) => {
            //invalidar cache
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', { id: product.id }] });
            //actualizar queryData
            queryClient.setQueryData(['products', { id: product.id }], product)

        },
    });


    return {
        ...query,
        mutation,
    }
}
