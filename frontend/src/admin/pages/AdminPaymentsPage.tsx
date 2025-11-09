import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, Check, X, Loader2, Plus, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { currencyFormatter } from '@/lib/currency-formatter';
import { Textarea } from '@/components/ui/textarea';
import {
    getPagosAction,
    createPagoAction,
    approvePagoAction,
    rejectPagoAction,
    type Pago
} from '@/admin/actions/pagos.action';
import { getPedidosAction } from '@/admin/actions/pedidos.action';

const estadoBadgeColors = {
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    COMPLETADO: 'bg-green-100 text-green-800',
    FALLIDO: 'bg-red-100 text-red-800',
};

const metodoPagoLabels = {
    STRIPE: 'Stripe',
    PAYPAL: 'PayPal',
    QR_MANUAL: 'QR Manual',
};

const estadoLabels = {
    PENDIENTE: 'Pendiente',
    COMPLETADO: 'Completado',
    FALLIDO: 'Fallido',
};

export default function AdminPaymentsPage() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [metodoPagoFilter, setMetodoPagoFilter] = useState<string>('TODOS');
    const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
    const [selectedPayment, setSelectedPayment] = useState<Pago | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form states para crear pago
    const [pedidoId, setPedidoId] = useState('');
    const [metodoPago, setMetodoPago] = useState<'STRIPE' | 'QR_MANUAL'>('QR_MANUAL');
    const [monto, setMonto] = useState('');
    const [notas, setNotas] = useState('');

    // Fetch payments con configuración optimizada
    const { data: paymentsData, isLoading, refetch } = useQuery({
        queryKey: ['admin-payments'],
        queryFn: getPagosAction,
        staleTime: 1000 * 60 * 2, // 2 minutos
        refetchOnWindowFocus: true,
        refetchOnMount: 'always',
    });

    // Fetch pedidos para el formulario de crear pago
    const { data: pedidosData } = useQuery({
        queryKey: ['admin-pedidos'],
        queryFn: getPedidosAction,
        staleTime: 1000 * 60 * 5, // 5 minutos
        enabled: isCreateModalOpen, // Solo cargar cuando se abre el modal
    });

    // Approve payment mutation con optimistic update
    const approvePaymentMutation = useMutation({
        mutationFn: approvePagoAction,
        onMutate: async (pagoId) => {
            await queryClient.cancelQueries({ queryKey: ['admin-payments'] });
            const previousPayments = queryClient.getQueryData<Pago[]>(['admin-payments']);

            if (previousPayments) {
                queryClient.setQueryData<Pago[]>(['admin-payments'], (old) =>
                    old?.map((payment) =>
                        payment.id === pagoId ? { ...payment, estado: 'COMPLETADO' } : payment
                    )
                );
            }

            if (selectedPayment?.id === pagoId) {
                setSelectedPayment({ ...selectedPayment, estado: 'COMPLETADO' });
            }

            return { previousPayments };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousPayments) {
                queryClient.setQueryData(['admin-payments'], context.previousPayments);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
        },
        onSuccess: () => {
            setIsDetailModalOpen(false);
        },
    });

    // Reject payment mutation con optimistic update
    const rejectPaymentMutation = useMutation({
        mutationFn: rejectPagoAction,
        onMutate: async (pagoId) => {
            await queryClient.cancelQueries({ queryKey: ['admin-payments'] });
            const previousPayments = queryClient.getQueryData<Pago[]>(['admin-payments']);

            if (previousPayments) {
                queryClient.setQueryData<Pago[]>(['admin-payments'], (old) =>
                    old?.map((payment) =>
                        payment.id === pagoId ? { ...payment, estado: 'FALLIDO' } : payment
                    )
                );
            }

            if (selectedPayment?.id === pagoId) {
                setSelectedPayment({ ...selectedPayment, estado: 'FALLIDO' });
            }

            return { previousPayments };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousPayments) {
                queryClient.setQueryData(['admin-payments'], context.previousPayments);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
        },
        onSuccess: () => {
            setIsDetailModalOpen(false);
        },
    });

    // Create payment mutation con optimistic update
    const createPaymentMutation = useMutation({
        mutationFn: createPagoAction,
        onMutate: async (newPayment) => {
            await queryClient.cancelQueries({ queryKey: ['admin-payments'] });
            const previousPayments = queryClient.getQueryData<Pago[]>(['admin-payments']);

            // Agregar el nuevo pago optimistamente
            const pedidoSeleccionado = pedidosData?.find(p => Number(p.id) === newPayment.pedido_id);
            if (pedidoSeleccionado) {
                const tempPayment: Pago = {
                    id: Date.now(), // ID temporal
                    pedido: {
                        id: Number(pedidoSeleccionado.id),
                        usuario: pedidoSeleccionado.usuario,
                        total: pedidoSeleccionado.total_pedido,
                    },
                    metodo_pago: newPayment.metodo_pago as Pago['metodo_pago'],
                    estado: newPayment.estado as Pago['estado'],
                    monto: newPayment.monto || pedidoSeleccionado.total_pedido,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                queryClient.setQueryData<Pago[]>(['admin-payments'], (old) => [tempPayment, ...(old || [])]);
            }

            return { previousPayments };
        },
        onError: (_err, _variables, context) => {
            if (context?.previousPayments) {
                queryClient.setQueryData(['admin-payments'], context.previousPayments);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
            queryClient.invalidateQueries({ queryKey: ['admin-pedidos'] });
        },
        onSuccess: () => {
            setIsCreateModalOpen(false);
            // Reset form
            setPedidoId('');
            setMetodoPago('QR_MANUAL');
            setMonto('');
            setNotas('');
        },
    });

    const filteredPayments = paymentsData?.filter((payment) => {
        const matchesSearch =
            payment.id.toString().includes(searchTerm.toLowerCase()) ||
            payment.pedido.id.toString().includes(searchTerm.toLowerCase()) ||
            payment.pedido.usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${payment.pedido.usuario.first_name} ${payment.pedido.usuario.last_name}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase());

        const matchesMetodo = metodoPagoFilter === 'TODOS' || payment.metodo_pago === metodoPagoFilter;
        const matchesEstado = estadoFilter === 'TODOS' || payment.estado === estadoFilter;

        return matchesSearch && matchesMetodo && matchesEstado;
    });

    const handleViewDetails = (payment: Pago) => {
        setSelectedPayment(payment);
        setIsDetailModalOpen(true);
    };

    const handleApprove = () => {
        if (selectedPayment) {
            approvePaymentMutation.mutate(selectedPayment.id);
        }
    };

    const handleReject = () => {
        if (selectedPayment) {
            rejectPaymentMutation.mutate(selectedPayment.id);
        }
    };

    const handleCreatePayment = () => {
        if (!pedidoId || !metodoPago) return;

        const pedidoSeleccionado = pedidosData?.find(p => p.id.toString() === pedidoId);
        if (!pedidoSeleccionado) return;

        createPaymentMutation.mutate({
            pedido_id: parseInt(pedidoId),
            metodo_pago: metodoPago,
            monto: monto || pedidoSeleccionado.total_pedido,
            estado: 'COMPLETADO', // Por defecto, los pagos creados por admin son completados
        });
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Pagos</h1>
                    <p className="text-gray-600 mt-1">Administra y verifica todos los pagos de la tienda</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => refetch()}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Pago
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-4 items-end">
                <div className="flex-1">
                    <Label htmlFor="search">Buscar</Label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            id="search"
                            placeholder="Buscar por ID de pago, ID de pedido, email o nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="w-48">
                    <Label htmlFor="metodo-filter">Método de Pago</Label>
                    <Select value={metodoPagoFilter} onValueChange={setMetodoPagoFilter}>
                        <SelectTrigger id="metodo-filter">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TODOS">Todos</SelectItem>
                            <SelectItem value="STRIPE">Stripe</SelectItem>
                            <SelectItem value="PAYPAL">PayPal</SelectItem>
                            <SelectItem value="QR_MANUAL">QR Manual</SelectItem>
                        </SelectContent>
                    </Select>
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
                            <SelectItem value="COMPLETADO">Completado</SelectItem>
                            <SelectItem value="FALLIDO">Fallido</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-lg shadow">
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : filteredPayments && filteredPayments.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID Pago</TableHead>
                                <TableHead>ID Pedido</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Método</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Monto</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-mono">#{payment.id}</TableCell>
                                    <TableCell className="font-mono">#{payment.pedido.id}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">
                                                {payment.pedido.usuario.first_name} {payment.pedido.usuario.last_name}
                                            </p>
                                            <p className="text-sm text-gray-500">{payment.pedido.usuario.email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{metodoPagoLabels[payment.metodo_pago]}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={estadoBadgeColors[payment.estado]}>
                                            {estadoLabels[payment.estado]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        {currencyFormatter(parseFloat(payment.monto))}
                                    </TableCell>
                                    <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(payment)}>
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
                        <p className="text-gray-500">No se encontraron pagos</p>
                    </div>
                )}
            </div>

            {/* Payment Detail Modal */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalle del Pago #{selectedPayment?.id}</DialogTitle>
                    </DialogHeader>

                    {selectedPayment && (
                        <div className="space-y-6">
                            {/* Payment Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-gray-500">Cliente</Label>
                                    <p className="font-medium">
                                        {selectedPayment.pedido.usuario.first_name} {selectedPayment.pedido.usuario.last_name}
                                    </p>
                                    <p className="text-sm text-gray-600">{selectedPayment.pedido.usuario.email}</p>
                                </div>

                                <div>
                                    <Label className="text-gray-500">ID del Pedido</Label>
                                    <p className="font-mono">#{selectedPayment.pedido.id}</p>
                                </div>

                                <div>
                                    <Label className="text-gray-500">Método de Pago</Label>
                                    <Badge variant="outline" className="mt-1">
                                        {metodoPagoLabels[selectedPayment.metodo_pago]}
                                    </Badge>
                                </div>

                                <div>
                                    <Label className="text-gray-500">Estado</Label>
                                    <div className="mt-1">
                                        <Badge className={estadoBadgeColors[selectedPayment.estado]}>
                                            {estadoLabels[selectedPayment.estado]}
                                        </Badge>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-gray-500">Monto del Pago</Label>
                                    <p className="text-xl font-bold text-gray-900">
                                        {currencyFormatter(parseFloat(selectedPayment.monto))}
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-gray-500">Total del Pedido</Label>
                                    <p className="text-xl font-bold text-gray-900">
                                        {currencyFormatter(parseFloat(selectedPayment.pedido.total))}
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-gray-500">Fecha de Pago</Label>
                                    <p>{new Date(selectedPayment.created_at).toLocaleString()}</p>
                                </div>

                                <div>
                                    <Label className="text-gray-500">Última Actualización</Label>
                                    <p>{new Date(selectedPayment.updated_at).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Payment Provider IDs */}
                            {selectedPayment.stripe_payment_intent_id && (
                                <div>
                                    <Label className="text-gray-500">Stripe Payment Intent ID</Label>
                                    <p className="font-mono text-sm mt-1 p-2 bg-gray-50 rounded">
                                        {selectedPayment.stripe_payment_intent_id}
                                    </p>
                                </div>
                            )}

                            {selectedPayment.paypal_order_id && (
                                <div>
                                    <Label className="text-gray-500">PayPal Order ID</Label>
                                    <p className="font-mono text-sm mt-1 p-2 bg-gray-50 rounded">
                                        {selectedPayment.paypal_order_id}
                                    </p>
                                </div>
                            )}

                            {/* QR Receipt */}
                            {selectedPayment.qr_comprobante && (
                                <div>
                                    <Label className="text-gray-500 mb-2 block">Comprobante QR</Label>
                                    <div className="border rounded-lg p-4 bg-gray-50">
                                        <img
                                            src={selectedPayment.qr_comprobante}
                                            alt="Comprobante QR"
                                            className="max-w-full h-auto mx-auto"
                                            style={{ maxHeight: '400px' }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons for QR Manual Payments */}
                            {selectedPayment.metodo_pago === 'QR_MANUAL' &&
                                selectedPayment.estado === 'PENDIENTE' && (
                                    <div className="flex gap-3 pt-4 border-t">
                                        <Button
                                            onClick={handleApprove}
                                            disabled={approvePaymentMutation.isPending || rejectPaymentMutation.isPending}
                                            className="flex-1"
                                        >
                                            {approvePaymentMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <Check className="h-4 w-4 mr-2" />
                                            )}
                                            Aprobar Pago
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleReject}
                                            disabled={approvePaymentMutation.isPending || rejectPaymentMutation.isPending}
                                            className="flex-1"
                                        >
                                            {rejectPaymentMutation.isPending ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <X className="h-4 w-4 mr-2" />
                                            )}
                                            Rechazar Pago
                                        </Button>
                                    </div>
                                )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Payment Modal */}
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Crear Pago Manual</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="pedido-select">Pedido *</Label>
                            <Select value={pedidoId} onValueChange={setPedidoId}>
                                <SelectTrigger id="pedido-select">
                                    <SelectValue placeholder="Seleccionar pedido..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {pedidosData?.filter(p => p.estado === 'PENDIENTE').map((pedido) => (
                                        <SelectItem key={pedido.id} value={pedido.id.toString()}>
                                            Pedido #{pedido.id} - {pedido.usuario.email} - {currencyFormatter(parseFloat(pedido.total_pedido))}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="metodo-pago-select">Método de Pago *</Label>
                            <Select value={metodoPago} onValueChange={(value) => setMetodoPago(value as 'STRIPE' | 'QR_MANUAL')}>
                                <SelectTrigger id="metodo-pago-select">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="QR_MANUAL">QR Manual</SelectItem>
                                    <SelectItem value="STRIPE">Stripe</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="monto-input">
                                Monto (opcional)
                                <span className="text-sm text-gray-500 ml-2">
                                    Si está vacío, se usa el total del pedido
                                </span>
                            </Label>
                            <Input
                                id="monto-input"
                                type="number"
                                step="0.01"
                                placeholder="Ej: 100.00"
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                            />
                        </div>

                        <div>
                            <Label htmlFor="notas-textarea">Notas (opcional)</Label>
                            <Textarea
                                id="notas-textarea"
                                placeholder="Notas adicionales sobre este pago..."
                                value={notas}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotas(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setIsCreateModalOpen(false)}
                                disabled={createPaymentMutation.isPending}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleCreatePayment}
                                disabled={createPaymentMutation.isPending || !pedidoId}
                                className="flex-1"
                            >
                                {createPaymentMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4 mr-2" />
                                )}
                                Crear Pago
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
