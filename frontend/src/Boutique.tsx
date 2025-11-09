import { RouterProvider } from "react-router"
import { appRouter } from "./app.router"

import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'sonner'
import type { PropsWithChildren } from "react"
import { useAuthStore } from "./auth/store/auth.store"
// import { queryClient } from "./lib/query-client"


export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5, // 5 minutos
        },
    },
});

const ChechAuthProvider = ({ children }: PropsWithChildren) => {

    const { checkAuthStatus } = useAuthStore()

    const { isLoading } = useQuery({
        queryKey: ['auth'],
        queryFn: checkAuthStatus,
        retry: false,
        refetchInterval: 1000 * 60 * 60,
        refetchOnWindowFocus: true
    })
    // Todo: Hacer componenete de cargar
    if (isLoading) return <h1>Cargando</h1>

    return children
}

export const Boutique = () => {

    return (
        <QueryClientProvider client={queryClient}>
            <Toaster />
            {/* Custom Provider */}
            <ChechAuthProvider>
                <RouterProvider router={appRouter} />
            </ChechAuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    )
}
