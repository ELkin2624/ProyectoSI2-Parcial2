import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const TopProductsTable = () => {
    // Datos de ejemplo - estos deberían venir de la API
    const topProducts = [
        {
            id: 1,
            nombre: 'Camisa Formal Slim Fit',
            categoria: 'Camisas',
            ventas: 156,
            ingresos: 'Bs. 23,400',
            stock: 45
        },
        {
            id: 2,
            nombre: 'Vestido Cóctel Negro',
            categoria: 'Vestidos',
            ventas: 134,
            ingresos: 'Bs. 46,900',
            stock: 23
        },
        {
            id: 3,
            nombre: 'Jean Skinny High Waist',
            categoria: 'Pantalones',
            ventas: 128,
            ingresos: 'Bs. 24,320',
            stock: 67
        },
        {
            id: 4,
            nombre: 'Polo Premium Pique',
            categoria: 'Polos',
            ventas: 112,
            ingresos: 'Bs. 13,440',
            stock: 89
        },
        {
            id: 5,
            nombre: 'Blusa de Seda Elegante',
            categoria: 'Blusas',
            ventas: 98,
            ingresos: 'Bs. 21,560',
            stock: 34
        }
    ];

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {topProducts.map((product) => (
                    <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.nombre}</TableCell>
                        <TableCell>
                            <Badge variant="outline">{product.categoria}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{product.ventas}</TableCell>
                        <TableCell className="text-right font-semibold">{product.ingresos}</TableCell>
                        <TableCell className="text-right">
                            <span className={product.stock < 30 ? 'text-red-600' : 'text-green-600'}>
                                {product.stock}
                            </span>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
