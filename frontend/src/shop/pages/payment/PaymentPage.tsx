import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CreditCard, QrCode, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getPedidoByIdAction } from "../../actions/pedidos.action";
import { createPagoAction, uploadQRComprobanteAction, type CreatePagoData, type PagoQRResponse } from "../../actions/pagos.action";
import { StripeCheckoutForm } from "../../components/StripeCheckoutForm";

// Inicializar Stripe usando la variable de entorno
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
console.log('🔑 Stripe Public Key:', STRIPE_PUBLIC_KEY ? 'Configurada' : 'NO ENCONTRADA');
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;
console.log('🔌 Stripe Promise:', stripePromise ? 'Inicializada' : 'NULL');

type MetodoPago = 'STRIPE' | 'QR_MANUAL';

export const PaymentPage = () => {
    const { pedidoId } = useParams<{ pedidoId: string }>();
    const navigate = useNavigate();
    const [metodoPago, setMetodoPago] = useState<MetodoPago>('QR_MANUAL');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [pagoCreado, setPagoCreado] = useState<PagoQRResponse | null>(null);
    const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
    const [stripePagoId, setStripePagoId] = useState<string | null>(null);
    const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | null>(null);

    // Query para obtener detalles del pedido
    const { data: pedido, isLoading: loadingPedido } = useQuery({
        queryKey: ['pedido', pedidoId],
        queryFn: () => getPedidoByIdAction(pedidoId!),
        enabled: !!pedidoId,
    });

    // Mutation para crear pago
    const createPagoMutation = useMutation({
        mutationFn: (data: CreatePagoData) => createPagoAction(data),
        onSuccess: (data) => {
            if ('client_secret' in data) {
                // Es pago con Stripe
                console.log('✅ Client Secret recibido:', data.client_secret);
                console.log('✅ Pago ID:', data.pago_id);
                console.log('✅ Payment Intent ID:', data.payment_intent_id);
                console.log('🔌 Stripe Promise disponible:', !!stripePromise);
                setStripeClientSecret(data.client_secret);
                setStripePagoId(data.pago_id);
                setStripePaymentIntentId(data.payment_intent_id);
                toast.success('Formulario de pago cargado. Ingresa los datos de tu tarjeta.');
            } else {
                // Es pago QR
                setPagoCreado(data);
                toast.success('Pago QR creado. Sube tu comprobante de pago.');
            }
        },
        onError: (error: any) => {
            const errorMsg = error?.response?.data?.detail
                || error?.response?.data?.message
                || 'Error al crear el pago';
            toast.error(errorMsg);
            console.error('Error al crear pago:', error?.response?.data);
        },
    });

    // Mutation para subir comprobante QR
    const uploadQRMutation = useMutation({
        mutationFn: ({ pagoId, file }: { pagoId: string; file: File }) =>
            uploadQRComprobanteAction(pagoId, file),
        onSuccess: () => {
            toast.success('Comprobante subido exitosamente. Tu pago está en verificación.');
            setTimeout(() => {
                navigate('/my-payments');
            }, 2000);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Error al subir el comprobante');
        },
    });

    const handleCrearPago = () => {
        if (!pedidoId) return;

        createPagoMutation.mutate({
            pedido_id: pedidoId,
            metodo_pago: metodoPago,
        });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar que sea una imagen
            if (!file.type.startsWith('image/')) {
                toast.error('Por favor selecciona una imagen válida');
                return;
            }
            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('La imagen no debe superar los 5MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUploadComprobante = () => {
        if (!pagoCreado || !selectedFile) return;

        uploadQRMutation.mutate({
            pagoId: pagoCreado.id,
            file: selectedFile,
        });
    };

    if (loadingPedido) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!pedido) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
                        <p className="text-lg font-medium">Pedido no encontrado</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Pagar Pedido</h1>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Resumen del pedido */}
                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumen</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Pedido</p>
                                    <p className="font-mono text-xs">{pedido.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Estado</p>
                                    <p className="font-medium">{pedido.estado}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Items</p>
                                    <p className="font-medium">{pedido.items.length}</p>
                                </div>
                                <div className="pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">Total a Pagar</p>
                                    <p className="text-2xl font-bold">${pedido.total_pedido}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Método de pago */}
                    <div className="md:col-span-2">
                        {!pagoCreado && !stripeClientSecret ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Método de Pago</CardTitle>
                                    <CardDescription>
                                        Selecciona cómo deseas pagar tu pedido
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <RadioGroup
                                        value={metodoPago}
                                        onValueChange={(value) => setMetodoPago(value as MetodoPago)}
                                    >
                                        <Card className={metodoPago === 'QR_MANUAL' ? 'border-primary' : ''}>
                                            <CardHeader>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="QR_MANUAL" id="qr" />
                                                    <Label htmlFor="qr" className="cursor-pointer flex items-center gap-2 text-base">
                                                        <QrCode className="h-5 w-5" />
                                                        Transferencia / QR
                                                    </Label>
                                                </div>
                                            </CardHeader>
                                            {metodoPago === 'QR_MANUAL' && (
                                                <CardContent>
                                                    <p className="text-sm text-muted-foreground">
                                                        Genera un código QR para realizar el pago mediante transferencia bancaria.
                                                        Deberás subir el comprobante para verificación.
                                                    </p>
                                                </CardContent>
                                            )}
                                        </Card>

                                        <Card className={metodoPago === 'STRIPE' ? 'border-primary' : ''}>
                                            <CardHeader>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="STRIPE" id="stripe" />
                                                    <Label htmlFor="stripe" className="cursor-pointer flex items-center gap-2 text-base">
                                                        <CreditCard className="h-5 w-5" />
                                                        Tarjeta de Crédito/Débito
                                                    </Label>
                                                </div>
                                            </CardHeader>
                                            {metodoPago === 'STRIPE' && (
                                                <CardContent>
                                                    <p className="text-sm text-muted-foreground">
                                                        Pago seguro mediante Stripe. Acepta todas las tarjetas principales.
                                                    </p>
                                                    <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                                                        ✅ Stripe configurado y listo para usar
                                                    </p>
                                                </CardContent>
                                            )}
                                        </Card>
                                    </RadioGroup>

                                    <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={handleCrearPago}
                                        disabled={createPagoMutation.isPending}
                                    >
                                        {createPagoMutation.isPending && (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        )}
                                        Continuar al Pago
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : stripeClientSecret ? (
                            // Formulario de pago con Stripe
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-6 w-6 text-primary" />
                                        Pagar con Tarjeta
                                    </CardTitle>
                                    <CardDescription>
                                        Ingresa los datos de tu tarjeta de crédito o débito
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {(() => {
                                        console.log('🎨 Renderizando formulario Stripe');
                                        console.log('   - stripePromise:', !!stripePromise);
                                        console.log('   - clientSecret:', !!stripeClientSecret);
                                        console.log('   - STRIPE_PUBLIC_KEY:', !!STRIPE_PUBLIC_KEY);
                                        return null;
                                    })()}

                                    {stripePromise ? (
                                        <div>
                                            <p className="text-sm text-green-600 mb-4">✅ Configuración de Stripe correcta</p>
                                            <Elements
                                                stripe={stripePromise}
                                                options={{
                                                    clientSecret: stripeClientSecret,
                                                    appearance: {
                                                        theme: 'stripe',
                                                    },
                                                }}
                                            >
                                                <StripeCheckoutForm
                                                    amount={pedido?.total_pedido || '0'}
                                                    pagoId={stripePagoId!}
                                                    paymentIntentId={stripePaymentIntentId!}
                                                    onSuccess={() => {
                                                        toast.success('Pago completado exitosamente');
                                                        setTimeout(() => {
                                                            navigate('/my-payments');
                                                        }, 2000);
                                                    }}
                                                />
                                            </Elements>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-red-800 text-sm font-semibold mb-2">
                                                ⚠️ Error: La clave pública de Stripe no está configurada
                                            </p>
                                            <p className="text-red-700 text-xs">
                                                Verifica que VITE_STRIPE_PUBLIC_KEY esté en el archivo .env y reinicia el servidor
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-4 pt-4 border-t">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full"
                                            onClick={() => {
                                                setStripeClientSecret(null);
                                                setMetodoPago('QR_MANUAL');
                                            }}
                                        >
                                            ← Usar otro método de pago
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : pagoCreado ? (
                            // Formulario para subir comprobante QR
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                                        Pago Creado
                                    </CardTitle>
                                    <CardDescription>
                                        Sube tu comprobante de pago para verificación
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Información del pago */}
                                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-3">
                                            <QrCode className="h-5 w-5 text-primary" />
                                            <p className="font-semibold text-primary">Datos para Transferencia</p>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Método:</span>
                                                <span className="font-medium">{pagoCreado.metodo_pago}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Monto a pagar:</span>
                                                <span className="font-bold text-lg">${pagoCreado.monto}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">ID de Pago:</span>
                                                <span className="font-mono text-xs">{pagoCreado.id}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-muted p-4 rounded-lg">
                                        <p className="text-sm font-medium mb-2">Instrucciones:</p>
                                        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                                            <li>Realiza la transferencia por <strong>${pagoCreado.monto}</strong> usando {pagoCreado.metodo_pago}</li>
                                            <li>Toma una foto o captura del comprobante de pago</li>
                                            <li>Sube la imagen aquí usando el botón de abajo</li>
                                            <li>Espera la verificación del administrador (24-48 horas)</li>
                                        </ol>
                                    </div>

                                    <div className="space-y-4">
                                        <Label>Comprobante de Pago</Label>
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <Label
                                                htmlFor="file-upload"
                                                className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted"
                                            >
                                                <Upload className="h-4 w-4" />
                                                Seleccionar Imagen
                                            </Label>
                                            {selectedFile && (
                                                <span className="text-sm text-muted-foreground">
                                                    {selectedFile.name}
                                                </span>
                                            )}
                                        </div>

                                        <Button
                                            className="w-full"
                                            size="lg"
                                            onClick={handleUploadComprobante}
                                            disabled={!selectedFile || uploadQRMutation.isPending}
                                        >
                                            {uploadQRMutation.isPending && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Subir Comprobante
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};
