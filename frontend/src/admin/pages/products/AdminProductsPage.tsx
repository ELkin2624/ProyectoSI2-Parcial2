import { AdminTitle } from "@/admin/components/AdminTitle"
import { CustomPagination } from "@/components/custom/CustomPagination"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { PlusIcon } from "lucide-react"
import { Link } from "react-router"



export const AdminProductsPage = () => {
    return (
        <>

            <div className="flex justify-between items-center">
                <AdminTitle
                    title="Productos"
                    subtitle="Aqui puedes ver y adminitrar tus productos`"
                />
                <Link to={'/admin/products/new'}>
                    <Button>
                        <PlusIcon />
                        Nuevo Producto
                    </Button>
                </Link>
            </div>


            <Table className="bg-white p-10 shadow-xs border border-gray-200 mb-10">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
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
                    <TableRow>
                        <TableCell className="font-medium">1</TableCell>
                        <TableCell>
                            <img
                                src="https://placehold.co/250x250"
                                alt="Product"
                                className="w-20 h-20 object-cover rounded-md"
                            />
                        </TableCell>
                        <TableCell>Producto 1</TableCell>
                        <TableCell>$250.00</TableCell>
                        <TableCell>Categoria1</TableCell>
                        <TableCell>100</TableCell>
                        <TableCell>XS,S,L</TableCell>


                        <TableCell className="text-right">
                            <Link to={`/admin/products/t-shirt-teslo`}>
                                Editar
                            </Link>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>


            <CustomPagination totalPages={10} />

        </>
    )
}
