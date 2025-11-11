import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, Eye, Loader2, CreditCard, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { boutiqueApi } from "@/api/BoutiqueApi";
import { currencyFormatter } from "@/lib/currency-formatter";
import { Link } from "react-router";

interface Pedido {
    id: string;
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

export const MyPaymentsPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPago, setSelectedPago] = useState<Pago | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Query para obtener MIS pagos (del usuario autenticado) con caché de 5 minutos
    const { data: pagos = [], isLoading } = useQuery({
        queryKey: ['mis-pagos'],
        queryFn: async () => {
            const { data } = await boutiqueApi.get<Pago[]>('/pagos/mis-pagos/');
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutos - datos considerados frescos
        gcTime: 1000 * 60 * 10, // 10 minutos - tiempo en caché
        refetchOnWindowFocus: false, // No refrescar al cambiar de ventana
    });

    const handleView = (pago: Pago) => {
        setSelectedPago(pago);
        setModalOpen(true);
    };

    // Filtrar pagos
    const filteredPagos = pagos.filter((pago) => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        return pago.id.toLowerCase().includes(searchLower);
    });

    const getMetodoPagoLabel = (metodo: string) => {
        const labels: Record<string, string> = {
            'STRIPE': 'Stripe (Tarjeta)',
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
            <div className="container mx-auto px-4 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link to="/">
                        <Button variant="ghost" className="mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver a productos
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <CreditCard className="h-8 w-8" />
                        Mis Pagos
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Historial de tus pagos y transacciones
                    </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    {/* Barra de búsqueda */}
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por ID de pago..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Tabla de pagos */}
                    {filteredPagos.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID Pago</TableHead>
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
                                                    size="sm"
                                                    onClick={() => handleView(pago)}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Ver detalles
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <CreditCard className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">
                                {searchTerm ? 'No se encontraron pagos' : 'Aún no tienes pagos registrados'}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                Tus pagos aparecerán aquí una vez que realices tu primera compra
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

                            {/* ID de transacción */}
                            {selectedPago.id_transaccion_pasarela && (
                                <div className="border-t pt-4">
                                    <p className="text-sm text-gray-500">ID de Transacción</p>
                                    <p className="font-mono text-sm">{selectedPago.id_transaccion_pasarela}</p>
                                </div>
                            )}

                            {/* Comprobante QR */}
                            {selectedPago.comprobante_qr && (
                                <div className="border-t pt-4">
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Tu Comprobante</p>
                                    <img
                                        src={selectedPago.comprobante_qr}
                                        alt="Comprobante QR"
                                        className="max-w-full h-auto rounded border"
                                    />
                                </div>
                            )}

                            {/* Estado del pago */}
                            {selectedPago.estado === 'PENDIENTE' && (
                                <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                                    <p className="text-sm text-yellow-800">
                                        <Clock className="inline h-4 w-4 mr-1" />
                                        <strong>Pago pendiente de verificación</strong>
                                    </p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        Tu pago está siendo revisado por nuestro equipo. Te notificaremos cuando sea aprobado.
                                    </p>
                                </div>
                            )}

                            {selectedPago.estado === 'COMPLETADO' && (
                                <div className="bg-green-50 p-4 rounded border border-green-200">
                                    <p className="text-sm text-green-800">
                                        <CheckCircle className="inline h-4 w-4 mr-1" />
                                        <strong>Pago completado exitosamente</strong>
                                    </p>
                                    <p className="text-xs text-green-700 mt-1">
                                        Tu pedido está siendo procesado.
                                    </p>
                                </div>
                            )}

                            {selectedPago.estado === 'FALLIDO' && (
                                <div className="bg-red-50 p-4 rounded border border-red-200">
                                    <p className="text-sm text-red-800">
                                        <XCircle className="inline h-4 w-4 mr-1" />
                                        <strong>Pago rechazado</strong>
                                    </p>
                                    <p className="text-xs text-red-700 mt-1">
                                        El pago no pudo ser procesado. Por favor, contacta con soporte.
                                    </p>
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
                                    <p className="text-sm text-gray-500">Última actualización</p>
                                    <p className="text-sm">
                                        {new Date(selectedPago.actualizado_en).toLocaleString('es-ES')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};
