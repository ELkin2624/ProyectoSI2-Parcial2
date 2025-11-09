import { TableCell, TableRow } from "@/components/ui/table"
import type { Productos } from "@/interfaces/productos.interface";
import { currencyFormatter } from "@/lib/currency-formatter";
import { PencilIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

interface Props {
    products: Productos[];
}

export const ProductRow = ({ products }: Props) => {
    return (
        <>
            {products.map(product => {
                // Obtener la primera imagen del producto
                const primeraImagen = product.imagenes_galeria?.[0]?.imagen_url || '/placeholder-image.png';

                // Obtener el precio más bajo de las variantes
                const precioMinimo = product.variantes.length > 0
                    ? Math.min(...product.variantes.map(v => parseFloat(v.precio_oferta || v.precio)))
                    : 0;

                // Obtener stock total de todas las variantes
                const stockTotal = product.variantes.reduce((acc, v) => acc + v.stock_total, 0);

                // Obtener todas las tallas/valores únicos
                const tallasUnicas = new Set<string>();
                product.variantes.forEach(variante => {
                    variante.valores.forEach(valor => {
                        if (valor.atributo.nombre.toLowerCase() === 'talla') {
                            tallasUnicas.add(valor.valor);
                        }
                    });
                });

                return (
                    <TableRow key={product.id}>
                        <TableCell>
                            <img
                                src={primeraImagen}
                                alt={product.nombre}
                                className="w-20 h-20 object-cover rounded-md"
                            />
                        </TableCell>
                        <TableCell>
                            <span className="font-medium">
                                {product.nombre}
                            </span>
                        </TableCell>
                        <TableCell>
                            {product.variantes.length > 0 ? (
                                <span>{currencyFormatter(precioMinimo)}</span>
                            ) : (
                                <span className="text-muted-foreground">N/A</span>
                            )}
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">
                                {product.categoria.nombre}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant={stockTotal > 0 ? "default" : "destructive"}>
                                {stockTotal} unidades
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {tallasUnicas.size > 0 ? (
                                <span className="text-sm">{Array.from(tallasUnicas).join(', ')}</span>
                            ) : (
                                <span className="text-muted-foreground text-sm">Sin tallas</span>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant={'ghost'} size={'icon'} asChild>
                                <Link to={`/admin/products/${product.slug}`}>
                                    <PencilIcon className="w-4 h-4" />
                                </Link>
                            </Button>
                        </TableCell>
                    </TableRow>
                );
            })}
        </>
    )
}
