import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Search, Eye, Loader2, CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { boutiqueApi } from "@/api/BoutiqueApi";
import { currencyFormatter } from "@/lib/currency-formatter";

interface Pedido {
    id: string;
    usuario: {
        id: number;
        email: string;
        first_name: string;
        last_name: string;
    };
}

interface Pago {
    id: string;
    pedido: Pedido;
    monto: string;
    metodo_pago: 'STRIPE' | 'PAYPAL' | 'QR_MANUAL';
    estado: 'PENDIENTE' | 'COMPLETADO' | 'FALLIDO';
    id_transaccion_pasarela: string | null;
    comprobante_qr: string | null;
    notas_admin: string | null;
    creado_en: string;
    actualizado_en: string;
}

export const PaymentsPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [filterEstado, setFilterEstado] = useState<string>("ALL");

    const queryClient = useQueryClient();

    // Query para obtener pagos
    const { data: pagos = [], isLoading } = useQuery({
        queryKey: ['pagos-admin'],
        queryFn: async () => {
            const { data } = await boutiqueApi.get<Pago[]>('/pagos/admin/');
            return data;
        },
    });

    // Mutation para aprobar pago QR
    const aprobarMutation = useMutation({
        mutationFn: async (pagoId: string) => {
            const response = await boutiqueApi.patch(`/pagos/admin/${pagoId}/`, {
                estado: 'COMPLETADO'
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success('Pago aprobado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['pagos-admin'] });
            setModalOpen(false);
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.detail || 'Error al aprobar pago';
            toast.error(errorMessage);
        },
    });

    // Mutation para rechazar pago
    const rechazarMutation = useMutation({
        mutationFn: async (pagoId: string) => {
            const response = await boutiqueApi.patch(`/pagos/admin/${pagoId}/`, {
                estado: 'FALLIDO'
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success('Pago rechazado');
            queryClient.invalidateQueries({ queryKey: ['pagos-admin'] });
            setModalOpen(false);
        },
        onError: (error: any) => {
            const errorMessage = error?.response?.data?.detail || 'Error al rechazar pago';
            toast.error(errorMessage);
        },
    });

    const handleView = (pago: Pago) => {
        setSelectedPago(pago);
        setModalOpen(true);
    };

    const handleAprobar = () => {
        if (selectedPago) {
            aprobarMutation.mutate(selectedPago.id);
        }
    };

    const handleRechazar = () => {
        if (selectedPago) {
            rechazarMutation.mutate(selectedPago.id);
        }
    };

    // Filtrar pagos
    const filteredPagos = pagos.filter((pago) => {
        const matchSearch = searchTerm
            ? pago.pedido.usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pago.pedido.usuario.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pago.pedido.usuario.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pago.id.toLowerCase().includes(searchTerm.toLowerCase())
            : true;

        const matchEstado = filterEstado === "ALL" ? true : pago.estado === filterEstado;

        return matchSearch && matchEstado;
    });

    const getMetodoPagoLabel = (metodo: string) => {
        const labels: Record<string, string> = {
            'STRIPE': 'Tarjeta (Stripe)',
            'PAYPAL': 'PayPal',
            'QR_MANUAL': 'QR Manual'
        };
        return labels[metodo] || metodo;
    };

    const getEstadoBadge = (estado: string) => {
        const config: Record<string, { color: string; icon: any; label: string }> = {
            'PENDIENTE': { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pendiente' },
            'COMPLETADO': { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Completado' },
            'FALLIDO': { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Fallido' }
        };
        const { color, icon: Icon, label } = config[estado] || config['PENDIENTE'];
        return (
            <Badge className={`${color} flex items-center gap-1 w-fit`}>
                <Icon className="h-3 w-3" />
                {label}
            </Badge>
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="h-8 w-8" />
                        Gestión de Pagos
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Administra y verifica los pagos de los clientes
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    {/* Filtros */}
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por cliente o ID de pago..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <select
                            value={filterEstado}
                            onChange={(e) => setFilterEstado(e.target.value)}
                            className="px-4 py-2 border rounded-md"
                        >
                            <option value="ALL">Todos los estados</option>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="COMPLETADO">Completado</option>
                            <option value="FALLIDO">Fallido</option>
                        </select>
                    </div>

                    {/* Tabla de pagos */}
                    {filteredPagos.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID Pago</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Método</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPagos.map((pago) => (
                                    <TableRow key={pago.id}>
                                        <TableCell className="font-mono text-xs">
                                            {pago.id.substring(0, 8)}...
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">
                                                    {pago.pedido.usuario.first_name} {pago.pedido.usuario.last_name}
                                                </p>
                                                <p className="text-xs text-gray-500">{pago.pedido.usuario.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {currencyFormatter(parseFloat(pago.monto))}
                                        </TableCell>
                                        <TableCell>{getMetodoPagoLabel(pago.metodo_pago)}</TableCell>
                                        <TableCell>{getEstadoBadge(pago.estado)}</TableCell>
                                        <TableCell>
                                            {new Date(pago.creado_en).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleView(pago)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-12">
                            <CreditCard className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">
                                {searchTerm ? 'No se encontraron pagos' : 'No hay pagos registrados'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Detalles */}
            {selectedPago && (
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Detalles del Pago</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            {/* Información básica */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">ID de Pago</p>
                                    <p className="font-mono text-sm">{selectedPago.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Estado</p>
                                    {getEstadoBadge(selectedPago.estado)}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Monto</p>
                                    <p className="font-semibold text-lg">
                                        {currencyFormatter(parseFloat(selectedPago.monto))}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Método de Pago</p>
                                    <p className="font-medium">{getMetodoPagoLabel(selectedPago.metodo_pago)}</p>
                                </div>
                            </div>

                            {/* Información del cliente */}
                            <div className="border-t pt-4">
                                <p className="text-sm font-semibold text-gray-700 mb-2">Cliente</p>
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="font-medium">
                                        {selectedPago.pedido.usuario.first_name} {selectedPago.pedido.usuario.last_name}
                                    </p>
                                    <p className="text-sm text-gray-600">{selectedPago.pedido.usuario.email}</p>
                                </div>
                            </div>

                            {/* ID de transacción */}
                            {selectedPago.id_transaccion_pasarela && (
                                <div>
                                    <p className="text-sm text-gray-500">ID de Transacción (Pasarela)</p>
                                    <p className="font-mono text-sm">{selectedPago.id_transaccion_pasarela}</p>
                                </div>
                            )}

                            {/* Comprobante QR */}
                            {selectedPago.comprobante_qr && (
                                <div className="border-t pt-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Comprobante QR</p>
                                    <img
                                        src={selectedPago.comprobante_qr}
                                        alt="Comprobante QR"
                                        className="max-w-full h-auto rounded border"
                                    />
                                </div>
                            )}

                            {/* Fechas */}
                            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                <div>
                                    <p className="text-sm text-gray-500">Creado</p>
                                    <p className="text-sm">
                                        {new Date(selectedPago.creado_en).toLocaleString('es-ES')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Actualizado</p>
                                    <p className="text-sm">
                                        {new Date(selectedPago.actualizado_en).toLocaleString('es-ES')}
                                    </p>
                                </div>
                            </div>

                            {/* Acciones para pagos pendientes con QR */}
                            {selectedPago.estado === 'PENDIENTE' && selectedPago.metodo_pago === 'QR_MANUAL' && (
                                <div className="flex gap-2 border-t pt-4">
                                    <Button
                                        onClick={handleAprobar}
                                        disabled={aprobarMutation.isPending}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                    >
                                        {aprobarMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Aprobar Pago
                                    </Button>
                                    <Button
                                        onClick={handleRechazar}
                                        disabled={rechazarMutation.isPending}
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        {rechazarMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Rechazar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};
