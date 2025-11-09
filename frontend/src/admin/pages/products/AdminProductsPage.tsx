import { AdminTitle } from "@/admin/components/AdminTitle"
import { ProductRow } from "@/admin/components/ProductRow"
import { CustomPagination } from "@/components/custom/CustomPagination"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { useProducts } from "@/shop/hooks/useProducts"
import { PlusIcon, Loader2 } from "lucide-react"
import { Link, useSearchParams } from "react-router"



export const AdminProductsPage = () => {

    const { data, isLoading } = useProducts() || {};
    const [searchParams] = useSearchParams();

    // Obtener el page_size actual (por defecto 12 según el backend)
    const pageSize = Number(searchParams.get('page_size')) || 12;

    // Calcular el total de páginas: count / page_size redondeado hacia arriba
    const totalPages = data?.count ? Math.ceil(data.count / pageSize) : 0;


    return (
        <>

            <div className="flex justify-between items-center">
                <AdminTitle
                    title="Productos"
                    subtitle="Aqui puedes ver y administrar tus productos"
                />
                <div className="flex justify-end mb-10 gap-4">
                    <Button asChild>
                        <Link to="/admin/products/new">
                            <PlusIcon />
                            Nuevo Producto
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {/* Table */}
            {!isLoading && (
                <>
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
                            {data?.results && data.results.length > 0 ? (
                                <ProductRow products={data.results} />
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No se encontraron productos
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <CustomPagination totalPages={totalPages} />
                </>
            )}

        </>
    )
}
