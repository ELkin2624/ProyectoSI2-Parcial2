import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { Button } from "@/components/ui/button";
import { CustomPagination } from "@/components/custom/CustomPagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, Loader2, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { boutiqueApi } from "@/api/BoutiqueApi";

interface Almacen {
    id: number;
    nombre: string;
    ubicacion: string;
    capacidad: number;
    activo: boolean;
}

interface AlmacenFormData {
    nombre: string;
    ubicacion: string;
    capacidad: string;
    activo: boolean;
}

interface PaginatedAlmacenesResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Almacen[];
}

export const AlmacenesSection = () => {
    const [searchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAlmacen, setSelectedAlmacen] = useState<Almacen | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [almacenToDelete, setAlmacenToDelete] = useState<Almacen | null>(null);
    const [formData, setFormData] = useState<AlmacenFormData>({
        nombre: "",
        ubicacion: "",
        capacidad: "",
        activo: true,
    });

    const queryClient = useQueryClient();

    // Query para obtener almacenes con caché de 5 minutos y paginación
    const { data: almacenesResponse, isLoading } = useQuery({
        queryKey: ['almacenes', currentPage],
        queryFn: async () => {
            const { data } = await boutiqueApi.get<PaginatedAlmacenesResponse>('/inventario/almacenes/', {
                params: { page: currentPage }
            });
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutos - datos considerados frescos
        gcTime: 1000 * 60 * 10, // 10 minutos - tiempo en caché
        refetchOnWindowFocus: false, // No refrescar al cambiar de ventana
    });

    const almacenes = almacenesResponse?.results || [];
    const totalPages = almacenesResponse ? Math.ceil(almacenesResponse.count / 20) : 1;

    // Mutation para crear almacén
    const createMutation = useMutation({
        mutationFn: async (data: AlmacenFormData) => {
            const payload = {
                ...data,
                capacidad: parseInt(data.capacidad),
            };
            const response = await boutiqueApi.post('/inventario/almacenes/', payload);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Almacén creado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['almacenes'] });
            setModalOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.detail || 'Error al crear almacén';
            toast.error(errorMessage);
        },
    });

    // Mutation para actualizar almacén
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: AlmacenFormData }) => {
            const payload = {
                ...data,
                capacidad: parseInt(data.capacidad),
            };
            const response = await boutiqueApi.put(`/inventario/almacenes/${id}/`, payload);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Almacén actualizado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['almacenes'] });
            setModalOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.detail || 'Error al actualizar almacén';
            toast.error(errorMessage);
        },
    });

    // Mutation para eliminar almacén
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            await boutiqueApi.delete(`/inventario/almacenes/${id}/`);
        },
        onSuccess: () => {
            toast.success('Almacén eliminado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['almacenes'] });
            setDeleteDialogOpen(false);
            setAlmacenToDelete(null);
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.detail || 'Error al eliminar almacén';
            toast.error(errorMessage);
        },
    });

    const resetForm = () => {
        setFormData({
            nombre: "",
            ubicacion: "",
            capacidad: "",
            activo: true,
        });
        setSelectedAlmacen(null);
    };

    const handleCreate = () => {
        resetForm();
        setModalOpen(true);
    };

    const handleEdit = (almacen: Almacen) => {
        setSelectedAlmacen(almacen);
        setFormData({
            nombre: almacen.nombre,
            ubicacion: almacen.ubicacion,
            capacidad: almacen.capacidad.toString(),
            activo: almacen.activo,
        });
        setModalOpen(true);
    };

    const handleDelete = (almacen: Almacen) => {
        setAlmacenToDelete(almacen);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (almacenToDelete) {
            deleteMutation.mutate(almacenToDelete.id);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre.trim()) {
            toast.error('El nombre es requerido');
            return;
        }
        if (!formData.capacidad || parseInt(formData.capacidad) <= 0) {
            toast.error('La capacidad debe ser mayor a 0');
            return;
        }

        if (selectedAlmacen) {
            updateMutation.mutate({ id: selectedAlmacen.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

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
                            <Warehouse className="h-5 w-5" />
                            Almacenes
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gestiona los almacenes o bodegas donde se almacenan los productos
                        </p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Almacén
                    </Button>
                </div>

                {almacenes.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Ubicación</TableHead>
                                <TableHead>Capacidad</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {almacenes.map((almacen) => (
                                <TableRow key={almacen.id}>
                                    <TableCell className="font-medium">{almacen.nombre}</TableCell>
                                    <TableCell>{almacen.ubicacion || '-'}</TableCell>
                                    <TableCell>{almacen.capacidad} m³</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${almacen.activo
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {almacen.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(almacen)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(almacen)}
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
                        <Warehouse className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">No hay almacenes creados aún.</p>
                        <p className="text-sm text-gray-400 mt-1">Haz clic en "Nuevo Almacén" para comenzar.</p>
                    </div>
                )}
            </div>

            {/* Modal de Almacén */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedAlmacen ? 'Editar Almacén' : 'Nuevo Almacén'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">Nombre *</Label>
                                <Input
                                    id="nombre"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Ej: Almacén Principal"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ubicacion">Ubicación</Label>
                                <Input
                                    id="ubicacion"
                                    value={formData.ubicacion}
                                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                                    placeholder="Ej: Calle 123, Ciudad"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="capacidad">Capacidad (m³) *</Label>
                                <Input
                                    id="capacidad"
                                    type="number"
                                    min="1"
                                    value={formData.capacidad}
                                    onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                                    placeholder="Ej: 1000"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="activo"
                                    checked={formData.activo}
                                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                    className="rounded"
                                />
                                <Label htmlFor="activo">Activo</Label>
                            </div>
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
                                {selectedAlmacen ? 'Actualizar' : 'Crear'}
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
                            Esta acción eliminará el almacén "{almacenToDelete?.nombre}".
                            Esta acción no se puede deshacer y eliminará todo el stock asociado.
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

            {/* Paginación */}
            {!isLoading && totalPages > 1 && (
                <div className="mt-6">
                    <CustomPagination totalPages={totalPages} />
                </div>
            )}
        </>
    );
};
