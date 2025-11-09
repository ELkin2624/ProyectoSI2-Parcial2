import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { getUsersAction } from "../actions/get-users.action";
import { createUserAction } from "../actions/create-user.action";
import { updateUserAction } from "../actions/update-user.action";
import { deleteUserAction } from "../actions/delete-user.action";
import type { CreateUserData, UpdateUserData } from "@/interfaces/user.response.interface";
import { toast } from "sonner";

export const useUsers = () => {
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();

    const page = Number(searchParams.get('page')) || 1;
    const page_size = Number(searchParams.get('page_size')) || 10;

    // Query para obtener usuarios
    const usersQuery = useQuery({
        queryKey: ['users', { page, page_size }],
        queryFn: () => getUsersAction({ page, page_size }),
        staleTime: 1000 * 60 * 5,
    });

    // Mutation para crear usuario
    const createUserMutation = useMutation({
        mutationFn: (userData: CreateUserData) => createUserAction(userData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Usuario creado exitosamente');
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.detail || 'Error al crear usuario';
            toast.error(errorMessage);
        }
    });

    // Mutation para actualizar usuario
    const updateUserMutation = useMutation({
        mutationFn: ({ userId, userData }: { userId: number, userData: UpdateUserData }) =>
            updateUserAction(userId, userData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Usuario actualizado exitosamente');
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.detail || 'Error al actualizar usuario';
            toast.error(errorMessage);
        }
    });

    // Mutation para eliminar usuario
    const deleteUserMutation = useMutation({
        mutationFn: (userId: number) => deleteUserAction(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Usuario eliminado exitosamente');
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.detail || 'Error al eliminar usuario';
            toast.error(errorMessage);
        }
    });

    return {
        // Query data
        users: usersQuery.data,
        isLoading: usersQuery.isLoading,
        isError: usersQuery.isError,
        error: usersQuery.error,

        // Mutations
        createUser: createUserMutation.mutateAsync,
        updateUser: updateUserMutation.mutateAsync,
        deleteUser: deleteUserMutation.mutateAsync,

        // Mutation states
        isCreating: createUserMutation.isPending,
        isUpdating: updateUserMutation.isPending,
        isDeleting: deleteUserMutation.isPending,
    };
};
