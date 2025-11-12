import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAtributosAction } from "@/admin/actions/get-atributos.action";
import { getValoresAtributosAction } from "@/admin/actions/get-valores-atributos.action";
import {
    createAtributoAction,
    updateAtributoAction,
    deleteAtributoAction,
    type CreateAtributoData
} from "@/admin/actions/manage-atributos.action";
import {
    createValorAtributoAction,
    updateValorAtributoAction,
    deleteValorAtributoAction,
    type CreateValorAtributoData
} from "@/admin/actions/manage-valores-atributos.action";
import { updateProductoAtributosAction } from "@/admin/actions/update-producto-atributos.action";

export const useAtributos = () => {
    const queryClient = useQueryClient();

    // Query para obtener todos los atributos
    const atributosQuery = useQuery({
        queryKey: ['atributos'],
        queryFn: getAtributosAction,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });

    // Query para obtener todos los valores
    const valoresQuery = useQuery({
        queryKey: ['valores-atributos'],
        queryFn: getValoresAtributosAction,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });

    // Mutation para crear atributo
    const createAtributo = useMutation({
        mutationFn: createAtributoAction,
        onSuccess: (newAtributo) => {
            toast.success('Atributo creado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['atributos'], exact: true });
            return newAtributo;
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Error al crear atributo');
        }
    });

    // Mutation para actualizar atributo
    const updateAtributo = useMutation({
        mutationFn: ({ id, data }: { id: number; data: CreateAtributoData }) =>
            updateAtributoAction(id, data),
        onSuccess: () => {
            toast.success('Atributo actualizado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['atributos'], exact: true });
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Error al actualizar atributo');
        }
    });

    // Mutation para eliminar atributo
    const deleteAtributo = useMutation({
        mutationFn: deleteAtributoAction,
        onSuccess: () => {
            toast.success('Atributo eliminado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['atributos'], exact: true });
            queryClient.invalidateQueries({ queryKey: ['valores-atributos'], exact: true });
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Error al eliminar atributo');
        }
    });

    // Mutation para crear valor
    const createValor = useMutation({
        mutationFn: createValorAtributoAction,
        onSuccess: (newValor) => {
            toast.success('Valor agregado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['valores-atributos'], exact: true });
            return newValor;
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Error al agregar valor');
        }
    });

    // Mutation para actualizar valor
    const updateValor = useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<CreateValorAtributoData> }) =>
            updateValorAtributoAction(id, data),
        onSuccess: () => {
            toast.success('Valor actualizado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['valores-atributos'], exact: true });
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Error al actualizar valor');
        }
    });

    // Mutation para eliminar valor
    const deleteValor = useMutation({
        mutationFn: deleteValorAtributoAction,
        onSuccess: () => {
            toast.success('Valor eliminado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['valores-atributos'], exact: true });
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Error al eliminar valor');
        }
    });

    // Mutation para actualizar atributos de un producto
    const updateProductoAtributos = useMutation({
        mutationFn: ({ productoId, atributosIds }: { productoId: number; atributosIds: number[] }) =>
            updateProductoAtributosAction(productoId, atributosIds),
        onSuccess: () => {
            toast.success('Atributos del producto actualizados exitosamente');
            // Invalidar el producto específico
            queryClient.invalidateQueries({ queryKey: ['product'], exact: false });
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Error al actualizar atributos del producto');
        }
    });

    // Helper para agrupar valores por atributo
    const getValoresPorAtributo = () => {
        if (!valoresQuery.data) return {};

        // Manejar tanto respuestas paginadas como arrays directos
        const valoresArray = Array.isArray(valoresQuery.data)
            ? valoresQuery.data
            : [];

        return valoresArray.reduce((acc, valor) => {
            if (!acc[valor.atributo.id]) {
                acc[valor.atributo.id] = [];
            }
            acc[valor.atributo.id].push(valor);
            return acc;
        }, {} as Record<number, typeof valoresArray>);
    };

    const isLoading = atributosQuery.isLoading || valoresQuery.isLoading;
    const isMutating = createAtributo.isPending ||
        updateAtributo.isPending ||
        deleteAtributo.isPending ||
        createValor.isPending ||
        updateValor.isPending ||
        deleteValor.isPending ||
        updateProductoAtributos.isPending;

    return {
        // Queries
        atributos: atributosQuery.data || [],
        valores: valoresQuery.data || [],
        valoresPorAtributo: getValoresPorAtributo(),
        isLoading,
        isMutating,

        // Mutations
        createAtributo,
        updateAtributo,
        deleteAtributo,
        createValor,
        updateValor,
        deleteValor,
        updateProductoAtributos,

        // Refetch
        refetchAtributos: atributosQuery.refetch,
        refetchValores: valoresQuery.refetch,
    };
};
