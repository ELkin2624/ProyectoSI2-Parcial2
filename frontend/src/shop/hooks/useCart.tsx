import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CreateItemCartAction } from "../actions/create-item-cart.action"
import { getCarritoAction } from "../actions/get-carrito.action";
import { updateItemCartAction } from "../actions/update-item-cart.action";
import { deleteItemCartAction } from "../actions/delete-item-cart.action";
import { useAuthStore } from "@/auth/store/auth.store";

export const useCart = () => {

    const authStatus = useAuthStore(state => state.authStatus);

    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['carrito'],
        queryFn: getCarritoAction,
        staleTime: 1000 * 60 * 5, // 5 minutos - datos considerados frescos
        gcTime: 1000 * 60 * 10, // 10 minutos - tiempo en caché
        enabled: authStatus === 'authenticated',
        refetchOnWindowFocus: false, // No refrescar al cambiar de ventana
        retry: false
    });

    const addItemMutation = useMutation({
        mutationFn: CreateItemCartAction,
        onSuccess: (data) => {
            // Actualizar el cache con la nueva data del carrito
            queryClient.setQueryData(['carrito'], data);
        },
        onError: (error) => {
            console.error('Error al agregar item al carrito:', error);
        }
    });

    const updateItemMutation = useMutation({
        mutationFn: updateItemCartAction,
        onSuccess: (data) => {
            // Actualizar el cache con la nueva data del carrito
            queryClient.setQueryData(['carrito'], data);
        },
        onError: (error) => {
            console.error('Error al actualizar item del carrito:', error);
        }
    });

    const deleteItemMutation = useMutation({
        mutationFn: deleteItemCartAction,
        onSuccess: (data) => {
            // Actualizar el cache con la nueva data del carrito
            queryClient.setQueryData(['carrito'], data);
        },
        onError: (error) => {
            console.error('Error al eliminar item del carrito:', error);
        }
    });

    return {
        ...query,
        addItemMutation,
        updateItemMutation,
        deleteItemMutation
    }
}
