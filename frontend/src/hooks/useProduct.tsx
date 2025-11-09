import { createUpdateProductAction, type CreateUpdateProductData } from "@/admin/actions/create-update-product.action"
import { getProductByIdAction } from "@/admin/actions/get-product-by-id.action"
import type { Productos } from "@/interfaces/productos.interface";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"



export const useProduct = (slug: string) => {

    const queryClient = useQueryClient();


    const query = useQuery({
        queryKey: ['product', { slug }],
        queryFn: () => getProductByIdAction(slug),
        retry: false,
        staleTime: 1000 * 30, // 30 segundos - más corto para actualizaciones más frecuentes
        refetchOnMount: 'always', // Siempre recargar al montar el componente
        refetchOnWindowFocus: true, // Recargar cuando la ventana vuelve a tener foco
        enabled: !!slug && slug !== 'new' // No ejecutar si no hay slug o es 'new'
    })

    const mutation = useMutation({
        mutationFn: (data: CreateUpdateProductData) => createUpdateProductAction(slug, data),
        onSuccess: (product: Productos) => {
            //invalidar cache
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', { slug: product.slug }] });
            //actualizar queryData
            queryClient.setQueryData(['product', { slug: product.slug }], product)

        },
    });


    return {
        ...query,
        mutation,
        refetch: query.refetch, // Exponer refetch para uso manual
    }
}
