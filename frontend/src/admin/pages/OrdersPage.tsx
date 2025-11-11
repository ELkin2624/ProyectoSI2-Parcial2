import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { currencyFormatter } from '@/lib/currency-formatter';
import { getPedidosAction, updatePedidoEstadoAction, type Pedido } from '@/admin/actions/pedidos.action';
import { CustomPagination } from '@/components/custom/CustomPagination';
import { useSearchParams } from 'react-router';

const estadoBadgeColors = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    EN_VERIFICACION: 'bg-orange-100 text-orange-800',
    PAGADO: 'bg-emerald-100 text-emerald-800',
    EN_PREPARACION: 'bg-blue-100 text-blue-800',
    ENVIADO: 'bg-purple-100 text-purple-800',
    ENTREGADO: 'bg-green-100 text-green-800',
    CANCELADO: 'bg-red-100 text-red-800',
};

const estadoLabels = {
    PENDIENTE: 'Pendiente',
    EN_VERIFICACION: 'En Verificación',
    PAGADO: 'Pagado',
    EN_PREPARACION: 'En Preparación',
    ENVIADO: 'Enviado',
    ENTREGADO: 'Entregado',
    CANCELADO: 'Cancelado',
};

export default function OrdersPage() {
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
    const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Obtener página actual de los parámetros de URL
    const currentPage = parseInt(searchParams.get('page') || '1', 10);

    // Fetch orders con paginación y configuración optimizada (caché de 5 minutos)
    const { data: ordersResponse, isLoading, refetch, error, isError } = useQuery({
        queryKey: ['admin-orders', currentPage],
        queryFn: () => getPedidosAction(currentPage),
        staleTime: 1000 * 60 * 5, // 5 minutos - datos considerados frescos
        gcTime: 1000 * 60 * 10, // 10 minutos - tiempo en caché
        refetchOnWindowFocus: false, // No refrescar al cambiar de ventana
        retry: 2, // Reintentar 2 veces en caso de error
    });

    const ordersData = ordersResponse?.results || [];
    const totalPages = ordersResponse ? Math.ceil(ordersResponse.count / 20) : 1;

    // Log para debugging
    console.log('Orders Query State:', {
        isLoading,
        isError,
        error,
        currentPage,
        totalCount: ordersResponse?.count,
        dataLength: ordersData?.length,
        totalPages
    });

    // Update order status mutation con optimistic update
    const updateStatusMutation = useMutation({
        mutationFn: async ({ orderId, estado }: { orderId: string; estado: string }) => {
            return updatePedidoEstadoAction(orderId, estado as Pedido['estado']);
        },
        // Optimistic update
        onMutate: async ({ orderId, estado }) => {
            // Cancelar queries pendientes
            await queryClient.cancelQueries({ queryKey: ['admin-orders'] });

            // Guardar snapshot previo
            const previousOrders = queryClient.getQueryData<Pedido[]>(['admin-orders']);

            // Actualizar optimistamente
            if (previousOrders) {
                queryClient.setQueryData<Pedido[]>(['admin-orders'], (old) =>
                    old?.map((order) =>
                        order.id === orderId ? { ...order, estado: estado as Pedido['estado'] } : order
                    )
                );
            }

            // Actualizar el pedido seleccionado si existe
            if (selectedOrder?.id === orderId) {
                setSelectedOrder({ ...selectedOrder, estado: estado as Pedido['estado'] });
            }

            return { previousOrders };
        },
        // Si falla, revertir
        onError: (_err, _variables, context) => {
            if (context?.previousOrders) {
                queryClient.setQueryData(['admin-orders'], context.previousOrders);
            }
        },
        // Siempre refrescar después
        onSettled: () => {
            // Invalidar todas las páginas de pedidos
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        },
        onSuccess: () => {
            setIsDetailModalOpen(false);
        },
    });

    const filteredOrders = ordersData?.filter((order) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            order.id.toString().toLowerCase().includes(searchLower) ||
            (order.usuario?.email || order.email_cliente).toLowerCase().includes(searchLower) ||
            `${order.usuario?.first_name || ''} ${order.usuario?.last_name || ''}`.toLowerCase().includes(searchLower);

        const matchesEstado = estadoFilter === 'TODOS' || order.estado === estadoFilter;

        return matchesSearch && matchesEstado;
    });

    const handleViewDetails = (order: Pedido) => {
        setSelectedOrder(order);
        setIsDetailModalOpen(true);
    };

    const handleUpdateStatus = (estado: string) => {
        if (selectedOrder) {
            updateStatusMutation.mutate({ orderId: selectedOrder.id, estado });
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
                    <p className="text-gray-600 mt-1">Administra todos los pedidos de la tienda</p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => refetch()}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-4 items-end">
                <div className="flex-1">
                    <Label htmlFor="search">Buscar</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            id="search"
                            placeholder="Buscar por ID, email o nombre del cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="w-48">
                    <Label htmlFor="estado-filter">Estado</Label>
                    <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                        <SelectTrigger id="estado-filter">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TODOS">Todos</SelectItem>
                            <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                            <SelectItem value="EN_VERIFICACION">En Verificación</SelectItem>
                            <SelectItem value="PAGADO">Pagado</SelectItem>
                            <SelectItem value="EN_PREPARACION">En Preparación</SelectItem>
                            <SelectItem value="ENVIADO">Enviado</SelectItem>
                            <SelectItem value="ENTREGADO">Entregado</SelectItem>
                            <SelectItem value="CANCELADO">Cancelado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        <p className="ml-2 text-gray-500">Cargando pedidos...</p>
                    </div>
                ) : isError ? (
                    <div className="text-center py-12">
                        <p className="text-red-500 font-semibold">Error al cargar pedidos</p>
                        <p className="text-gray-500 text-sm mt-2">{error?.message || 'Error desconocido'}</p>
                        <Button onClick={() => refetch()} className="mt-4">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reintentar
                        </Button>
                    </div>
                ) : filteredOrders && filteredOrders.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID Pedido</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-xs">
                                        {order.id.substring(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">
                                                {order.usuario?.first_name && order.usuario?.last_name
                                                    ? `${order.usuario.first_name} ${order.usuario.last_name}`
                                                    : 'Sin nombre'
                                                }
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {order.usuario?.email || order.email_cliente}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={estadoBadgeColors[order.estado]}>
                                            {estadoLabels[order.estado]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-semibold">{currencyFormatter(parseFloat(order.total_pedido))}</TableCell>
                                    <TableCell>{new Date(order.creado_en).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewDetails(order)}
                                        >
                                            <Eye className="h-4 w-4 mr-1" />
                                            Ver
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No se encontraron pedidos</p>
                    </div>
                )}
            </div>

            {/* Paginación */}
            {!isLoading && !isError && totalPages > 1 && (
                <div className="mt-6">
                    <CustomPagination totalPages={totalPages} />
                </div>
            )}

            {/* Order Detail Modal */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalle del Pedido #{selectedOrder?.id}</DialogTitle>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-6">
                            {/* Order Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-500">Cliente</Label>
                                    <p className="font-medium">
                                        {selectedOrder.usuario.first_name} {selectedOrder.usuario.last_name}
                                    </p>
                                    <p className="text-sm text-gray-600">{selectedOrder.usuario.email}</p>
                                </div>

                                <div>
                                    <Label className="text-gray-500">Estado Actual</Label>
                                    <div className="mt-1">
                                        <Badge className={estadoBadgeColors[selectedOrder.estado]}>
                                            {estadoLabels[selectedOrder.estado]}
                                        </Badge>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-gray-500">Fecha de Pedido</Label>
                                    <p>{new Date(selectedOrder.creado_en).toLocaleString()}</p>
                                </div>

                                <div>
                                    <Label className="text-gray-500">Última Actualización</Label>
                                    <p>{new Date(selectedOrder.actualizado_en).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div>
                                <Label className="text-gray-500">Dirección de Envío</Label>
                                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                                    <p>{selectedOrder.direccion_envio.calle}</p>
                                    <p>
                                        {selectedOrder.direccion_envio.ciudad}, {selectedOrder.direccion_envio.estado}
                                    </p>
                                    <p>
                                        {selectedOrder.direccion_envio.codigo_postal}, {selectedOrder.direccion_envio.pais}
                                    </p>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <Label className="text-gray-500 mb-2 block">Productos del Pedido</Label>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>SKU</TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead className="text-right">Precio Unit.</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedOrder.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.variante?.nombre || 'Producto sin nombre'}</TableCell>
                                                <TableCell className="font-mono text-sm">{item.variante?.sku || 'N/A'}</TableCell>
                                                <TableCell className="text-right">{item.cantidad}</TableCell>
                                                <TableCell className="text-right">
                                                    {currencyFormatter(parseFloat(item.precio_unitario))}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {currencyFormatter(parseFloat(item.subtotal))}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Total */}
                            <div className="flex justify-end pt-4 border-t">
                                <div className="text-right">
                                    <Label className="text-gray-500">Total del Pedido</Label>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {currencyFormatter(parseFloat(selectedOrder.total_pedido))}
                                    </p>
                                </div>
                            </div>

                            {/* Update Status */}
                            <div className="pt-4 border-t">
                                <Label className="text-gray-500 mb-2 block">Cambiar Estado del Pedido</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUpdateStatus('EN_VERIFICACION')}
                                        disabled={updateStatusMutation.isPending || selectedOrder.estado === 'EN_VERIFICACION'}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                        En Verificación
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUpdateStatus('PAGADO')}
                                        disabled={updateStatusMutation.isPending || selectedOrder.estado === 'PAGADO'}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                        Pagado
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUpdateStatus('EN_PREPARACION')}
                                        disabled={updateStatusMutation.isPending || selectedOrder.estado === 'EN_PREPARACION'}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                        En Preparación
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUpdateStatus('ENVIADO')}
                                        disabled={updateStatusMutation.isPending || selectedOrder.estado === 'ENVIADO'}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                        Enviado
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUpdateStatus('ENTREGADO')}
                                        disabled={updateStatusMutation.isPending || selectedOrder.estado === 'ENTREGADO'}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                        Entregado
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleUpdateStatus('CANCELADO')}
                                        disabled={updateStatusMutation.isPending || selectedOrder.estado === 'CANCELADO'}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-1" />
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
