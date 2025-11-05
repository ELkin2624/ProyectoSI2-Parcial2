import { Outlet } from "react-router"
import Header from "../components/CustomHeader"
import { CustomFooter } from "../components/CustomFooter"

export const ShopLayout = () => {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <Outlet />
            <CustomFooter />
        </div>
    )
}
