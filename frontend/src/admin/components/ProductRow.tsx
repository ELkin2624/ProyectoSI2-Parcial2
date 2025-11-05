import { TableCell, TableRow } from "@/components/ui/table"
import type { Product } from "@/interfaces/product.interface";
import { currencyFormatter } from "@/lib/currency-formatter";
import { PencilIcon } from "lucide-react";
import { Link } from "react-router"

interface Props {
    products: Product[];
}

export const ProductRow = ({ products }: Props) => {
    return (

        products.map(product => (

            <TableRow key={product.id}>
                <TableCell>
                    <img
                        src={product.images[1]}
                        alt={product.title}
                        className="w-20 h-20 object-cover rounded-md"
                    />
                </TableCell>
                <TableCell>
                    <Link
                        to={`/admin/products/${product.id}`}
                        className="hover:text-blue-500 underline"
                    >
                        {product.title}
                    </Link>
                </TableCell>
                <TableCell>{currencyFormatter(product.price)}</TableCell>
                <TableCell>{product.gender}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>{product.sizes.join(', ')}</TableCell>


                <TableCell className="text-right">
                    <Link to={`/admin/products/${product.id}`}>
                        <PencilIcon
                            className="w-4 h-4 text-blue-500"
                        />
                    </Link>
                </TableCell>
            </TableRow >

        ))


    )
}
