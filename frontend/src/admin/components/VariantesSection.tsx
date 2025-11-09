import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VarianteModal, type VarianteFormData } from "@/admin/components/VarianteModal";
import { createVarianteAction, updateVarianteAction, deleteVarianteAction } from "@/admin/actions/create-variante.action";
import type { Productos, Variante } from "@/interfaces/productos.interface";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { currencyFormatter } from "@/lib/currency-formatter";

interface Props {
    product: Productos;
}

export const VariantesSection = ({ product }: Props) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedVariante, setSelectedVariante] = useState<Variante | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [varianteToDelete, setVarianteToDelete] = useState<Variante | null>(null);

    const queryClient = useQueryClient();

    // Debug: Log del producto recibido
    console.log('🔍 VariantesSection - Producto:', {
        id: product.id,
        nombre: product.nombre,
        atributos: product.atributos,
        atributosLength: product.atributos?.length || 0,
        variantes: product.variantes?.length || 0,
        variantesData: product.variantes
    });

    // Mutation para crear variante
    const createMutation = useMutation({
        mutationFn: async (data: VarianteFormData) => {
            console.log('Iniciando creación de variante...', data);
            return createVarianteAction({
                producto: product.id,
                precio: data.precio,
                precio_oferta: data.precio_oferta || undefined,
                stock_inicial: data.stock_inicial ? parseInt(data.stock_inicial) : 0,
                activo: data.activo,
                valores_ids: data.valores_ids
            });
        },
        onSuccess: async (newVariante) => {
            console.log('✅ Variante creada exitosamente:', newVariante);
            toast.success('Variante creada exitosamente');

            console.log('🔄 Forzando recarga del producto...');

            // Invalidar el cache para forzar una recarga completa
            await queryClient.invalidateQueries({
                queryKey: ['product', { slug: product.slug }],
                exact: true,
                refetchType: 'all'
            });

            console.log('✅ Recarga completada');

            setModalOpen(false);
        },
        onError: (error: any) => {
            console.error('Error en createMutation:', error);

            // Extraer mensaje de error más específico
            let errorMessage = 'Error al crear variante';

            if (error?.response?.data) {
                const errorData = error.response.data;

                // Si hay errores de validación de campos
                if (typeof errorData === 'object') {
                    const errors = Object.entries(errorData).map(([key, value]) => {
                        if (Array.isArray(value)) {
                            return `${key}: ${value.join(', ')}`;
                        }
                        return `${key}: ${value}`;
                    }).join('\n');
                    errorMessage = errors || errorMessage;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.non_field_errors) {
                    errorMessage = Array.isArray(errorData.non_field_errors)
                        ? errorData.non_field_errors.join(', ')
                        : errorData.non_field_errors;
                }
            }

            toast.error(errorMessage, { duration: 5000 });
        }
    });

    // Mutation para actualizar variante
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: VarianteFormData }) =>
            updateVarianteAction(id, {
                precio: data.precio,
                precio_oferta: data.precio_oferta,
                activo: data.activo,
                valores_ids: data.valores_ids
            }),
        onSuccess: async () => {
            toast.success('Variante actualizada exitosamente');

            // Invalidar el cache para forzar recarga
            await queryClient.invalidateQueries({
                queryKey: ['product', { slug: product.slug }],
                exact: true,
                refetchType: 'all'
            });

            setModalOpen(false);
            setSelectedVariante(null);
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.detail ||
                error?.response?.data?.non_field_errors?.[0] ||
                'Error al actualizar variante';
            toast.error(errorMessage);
        }
    });

    // Mutation para eliminar variante
    const deleteMutation = useMutation({
        mutationFn: deleteVarianteAction,
        onSuccess: async () => {
            toast.success('Variante eliminada exitosamente');

            // Invalidar el cache para forzar recarga
            await queryClient.invalidateQueries({
                queryKey: ['product', { slug: product.slug }],
                exact: true,
                refetchType: 'all'
            });

            setDeleteDialogOpen(false);
            setVarianteToDelete(null);
        },
        onError: () => {
            toast.error('Error al eliminar variante');
        }
    });

    const handleCreate = () => {
        setSelectedVariante(null);
        setModalOpen(true);
    };

    const handleEdit = (variante: Variante) => {
        setSelectedVariante(variante);
        setModalOpen(true);
    };

    const handleDelete = (variante: Variante) => {
        setVarianteToDelete(variante);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (varianteToDelete) {
            deleteMutation.mutate(varianteToDelete.id);
        }
    };

    const handleSubmit = (data: VarianteFormData) => {
        if (selectedVariante) {
            updateMutation.mutate({ id: selectedVariante.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    // Obtener IDs de atributos del producto
    const atributosProducto = product.atributos?.map(attr => attr.id) || [];
    const tieneAtributos = atributosProducto.length > 0;
    const tieneVariantes = product.variantes && product.variantes.length > 0;

    return (
        <>
            <div className="mt-8 bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-semibold">Variantes del Producto</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {tieneAtributos
                                ? `Gestiona las diferentes combinaciones de ${product.atributos.map(a => a.nombre).join(', ')}`
                                : 'Gestiona las diferentes variantes (tallas, colores, etc.)'
                            }
                        </p>
                    </div>
                    <Button
                        onClick={handleCreate}
                        disabled={!tieneAtributos}
                        title={!tieneAtributos ? 'Primero configura los atributos del producto' : ''}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Variante
                    </Button>
                </div>

                {!tieneAtributos && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>⚠️ No hay atributos configurados.</strong><br />
                            Para crear nuevas variantes, primero configura los atributos en la sección <strong>"Atributos y Valores"</strong> arriba.
                        </p>
                    </div>
                )}

                {tieneVariantes ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>Atributos</TableHead>
                                <TableHead>Precio</TableHead>
                                <TableHead>Precio Oferta</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {product.variantes.map((variante) => (
                                <TableRow key={variante.id}>
                                    <TableCell className="font-mono text-sm">
                                        {variante.sku}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 flex-wrap">
                                            {variante.valores.map((valor) => (
                                                <Badge key={valor.id} variant="outline" className="text-xs">
                                                    {valor.atributo.nombre}: {valor.valor}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        {currencyFormatter(parseFloat(variante.precio))}
                                    </TableCell>
                                    <TableCell>
                                        {variante.precio_oferta ? (
                                            <span className="text-green-600 font-semibold">
                                                {currencyFormatter(parseFloat(variante.precio_oferta))}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={variante.stock_total > 0 ? "default" : "destructive"}>
                                            {variante.stock_total} unidades
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={variante.activo ? "default" : "secondary"}>
                                            {variante.activo ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(variante)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(variante)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-8">
                        <div className="text-muted-foreground">
                            <p>No hay variantes creadas aún.</p>
                            {tieneAtributos && (
                                <p className="text-sm mt-2">Haz clic en "Nueva Variante" para comenzar.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Variante */}
            <VarianteModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onSubmit={handleSubmit}
                variante={selectedVariante}
                atributosProducto={atributosProducto}
                isPending={createMutation.isPending || updateMutation.isPending}
            />

            {/* Dialog de Confirmación de Eliminación */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará la variante {varianteToDelete?.sku}.
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
