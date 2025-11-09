import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2, Loader2, Package, Search } from "lucide-react";
import { toast } from "sonner";
import { boutiqueApi } from "@/api/BoutiqueApi";

interface Almacen {
    id: number;
    nombre: string;
    ubicacion: string;
}

interface ProductoVariante {
    id: number;
    sku: string;
    producto: {
        id: number;
        nombre: string;
    };
}

interface Stock {
    id: number;
    variante: ProductoVariante;
    almacen: Almacen;
    cantidad: number;
}

interface StockFormData {
    variante_id: string;
    almacen_id: string;
    cantidad: string;
}

export const StockSection = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [stockToDelete, setStockToDelete] = useState<Stock | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [formData, setFormData] = useState<StockFormData>({
        variante_id: "",
        almacen_id: "",
        cantidad: "",
    });

    const queryClient = useQueryClient();

    // Query para obtener stock
    const { data: stocks = [], isLoading } = useQuery({
        queryKey: ['stocks'],
        queryFn: async () => {
            const { data } = await boutiqueApi.get<Stock[]>('/inventario/stock/');
            return data;
        },
    });

    // Query para obtener almacenes
    const { data: almacenes = [] } = useQuery({
        queryKey: ['almacenes'],
        queryFn: async () => {
            const { data } = await boutiqueApi.get<Almacen[]>('/inventario/almacenes/');
            return data;
        },
    });

    // Query para obtener variantes
    const { data: variantes = [] } = useQuery({
        queryKey: ['variantes-all'],
        queryFn: async () => {
            const { data } = await boutiqueApi.get<ProductoVariante[]>('/productos/admin/variantes/');
            return data;
        },
    });

    // Mutation para crear stock
    const createMutation = useMutation({
        mutationFn: async (data: StockFormData) => {
            const payload = {
                variante: parseInt(data.variante_id),
                almacen: parseInt(data.almacen_id),
                cantidad: parseInt(data.cantidad),
            };
            const response = await boutiqueApi.post('/inventario/stock/', payload);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Stock creado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['stocks'] });
            queryClient.invalidateQueries({ queryKey: ['product'] }); // Actualizar productos
            setModalOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.detail ||
                error?.response?.data?.non_field_errors?.[0] ||
                'Error al crear stock';
            toast.error(errorMessage);
        },
    });

    // Mutation para actualizar stock
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: StockFormData }) => {
            const payload = {
                variante: parseInt(data.variante_id),
                almacen: parseInt(data.almacen_id),
                cantidad: parseInt(data.cantidad),
            };
            const response = await boutiqueApi.put(`/inventario/stock/${id}/`, payload);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Stock actualizado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['stocks'] });
            queryClient.invalidateQueries({ queryKey: ['product'] });
            setModalOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.detail || 'Error al actualizar stock';
            toast.error(errorMessage);
        },
    });

    // Mutation para eliminar stock
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await boutiqueApi.delete(`/inventario/stock/${id}/`);
        },
        onSuccess: () => {
            toast.success('Stock eliminado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['stocks'] });
            queryClient.invalidateQueries({ queryKey: ['product'] });
            setDeleteDialogOpen(false);
            setStockToDelete(null);
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.detail || 'Error al eliminar stock';
            toast.error(errorMessage);
        },
    });

    const resetForm = () => {
        setFormData({
            variante_id: "",
            almacen_id: "",
            cantidad: "",
        });
        setSelectedStock(null);
    };

    const handleCreate = () => {
        resetForm();
        setModalOpen(true);
    };

    const handleEdit = (stock: Stock) => {
        setSelectedStock(stock);
        setFormData({
            variante_id: stock.variante.id.toString(),
            almacen_id: stock.almacen.id.toString(),
            cantidad: stock.cantidad.toString(),
        });
        setModalOpen(true);
    };

    const handleDelete = (stock: Stock) => {
        setStockToDelete(stock);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (stockToDelete) {
            deleteMutation.mutate(stockToDelete.id);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.variante_id) {
            toast.error('Selecciona una variante');
            return;
        }
        if (!formData.almacen_id) {
            toast.error('Selecciona un almacén');
            return;
        }
        if (!formData.cantidad || parseInt(formData.cantidad) < 0) {
            toast.error('La cantidad debe ser mayor o igual a 0');
            return;
        }

        if (selectedStock) {
            updateMutation.mutate({ id: selectedStock.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    // Filtrar stocks por búsqueda
    const filteredStocks = stocks.filter((stock) => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        const sku = stock.variante?.sku?.toLowerCase() || '';
        const productoNombre = stock.variante?.producto?.nombre?.toLowerCase() || '';
        const almacenNombre = stock.almacen?.nombre?.toLowerCase() || '';

        return (
            sku.includes(searchLower) ||
            productoNombre.includes(searchLower) ||
            almacenNombre.includes(searchLower)
        );
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-semibold flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Stock de Productos
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gestiona el inventario de variantes en cada almacén
                        </p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Stock
                    </Button>
                </div>

                {/* Barra de búsqueda */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por producto, SKU o almacén..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {filteredStocks.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Producto</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Almacén</TableHead>
                                <TableHead>Cantidad</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStocks.map((stock) => (
                                <TableRow key={stock.id}>
                                    <TableCell className="font-medium">
                                        {stock.variante.producto.nombre}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {stock.variante.sku}
                                    </TableCell>
                                    <TableCell>{stock.almacen.nombre}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stock.cantidad > 10
                                            ? 'bg-green-100 text-green-700'
                                            : stock.cantidad > 0
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}>
                                            {stock.cantidad} unidades
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(stock)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(stock)}
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
                    <div className="text-center py-12">
                        <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">
                            {searchTerm ? 'No se encontraron resultados' : 'No hay stock registrado aún.'}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            {!searchTerm && 'Haz clic en "Agregar Stock" para comenzar.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Modal de Stock */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedStock ? 'Editar Stock' : 'Agregar Stock'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="variante">Variante (Producto - SKU) *</Label>
                                <Select
                                    value={formData.variante_id}
                                    onValueChange={(value) => setFormData({ ...formData, variante_id: value })}
                                    disabled={!!selectedStock} // No permitir cambiar variante al editar
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una variante" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {variantes.map((variante) => (
                                            <SelectItem key={variante.id} value={variante.id.toString()}>
                                                {variante.producto.nombre} - {variante.sku}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="almacen">Almacén *</Label>
                                <Select
                                    value={formData.almacen_id}
                                    onValueChange={(value) => setFormData({ ...formData, almacen_id: value })}
                                    disabled={!!selectedStock} // No permitir cambiar almacén al editar
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona un almacén" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {almacenes.map((almacen) => (
                                            <SelectItem key={almacen.id} value={almacen.id.toString()}>
                                                {almacen.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cantidad">Cantidad *</Label>
                                <Input
                                    id="cantidad"
                                    type="number"
                                    min="0"
                                    value={formData.cantidad}
                                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                    placeholder="Ej: 100"
                                />
                            </div>

                            {selectedStock && (
                                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                                    <p><strong>Nota:</strong> Al editar stock, solo puedes modificar la cantidad.</p>
                                    <p>Para cambiar la variante o almacén, elimina y crea un nuevo registro.</p>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalOpen(false)}
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                {(createMutation.isPending || updateMutation.isPending) && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {selectedStock ? 'Actualizar' : 'Agregar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog de Confirmación de Eliminación */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción eliminará el registro de stock de "{stockToDelete?.variante.sku}" en "{stockToDelete?.almacen.nombre}".
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
