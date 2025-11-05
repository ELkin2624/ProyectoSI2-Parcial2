import { AdminTitle } from "@/admin/components/AdminTitle"
import { ProductRow } from "@/admin/components/ProductRow"
import { CustomPagination } from "@/components/custom/CustomPagination"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody } from "@/components/ui/table"
import { useProducts } from "@/shop/hooks/useProducts"
import { PlusIcon } from "lucide-react"
import { Link } from "react-router"



export const AdminProductsPage = () => {

    const { data } = useProducts() || [];


    return (
        <>

            <div className="flex justify-between items-center">
                <AdminTitle
                    title="Productos"
                    subtitle="Aqui puedes ver y adminitrar tus productos"
                />
                <div className="flex justify-end mb-10 gap-4">
                    <Link to={'/admin/products/new'}>
                        <Button>
                            <PlusIcon />
                            Nuevo Producto
                        </Button>
                    </Link>
                </div>
            </div>


            <Table className="bg-white p-10 shadow-xs border border-gray-200 mb-10">
                <TableHeader>
                    <TableRow>
                        <TableHead>Imagen</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Tallas</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <ProductRow products={data?.products || []} />
                </TableBody>
            </Table>


            <CustomPagination totalPages={data?.pages || 0} />

        </>
    )
}
