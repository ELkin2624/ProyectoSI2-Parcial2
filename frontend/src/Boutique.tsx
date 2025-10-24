import { RouterProvider } from "react-router"
import { appRouter } from "./app.router"

export const Boutique = () => {
    return (
        <RouterProvider router={appRouter} />
    )
}
