import { getProductByIdAction } from "@/admin/actions/get-product-by-id.action"
import { useQuery } from "@tanstack/react-query"



export const useProduct = (id: string) => {

    const query = useQuery({
        queryKey: ['product', id],
        queryFn: () => getProductByIdAction(id),
        retry: false,
        staleTime: 1000 * 60 * 5, //5minutos
        // enabled: !!id
    })

    //todo: Manejar mutacion


    return {
        ...query
    }
}
