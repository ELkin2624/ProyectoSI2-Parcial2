import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, CreditCard, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { getMyAddressesAction } from "../../actions/addresses.action";
import { createPedidoAction, type PedidoResponse } from "../../actions/pedidos.action";
import { getCarritoAction } from "../../actions/get-carrito.action";
import type { CarritoResponse } from "../../interfaces/carrito.response.interface";
import type { Address } from "../../actions/addresses.action";

export const CheckoutPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedAddressId, setSelectedAddressId] = useState<number | undefined>(undefined);

    // Obtener carrito
    const { data: cart, isLoading: loadingCart } = useQuery<CarritoResponse>({
        queryKey: ['carrito'],
        queryFn: getCarritoAction,
    });

    // Obtener direcciones
    const { data: addresses = [], isLoading: loadingAddresses } = useQuery<Address[]>({
        queryKey: ['addresses'],
        queryFn: getMyAddressesAction,
    });

    // Seleccionar automáticamente la dirección por defecto
    useEffect(() => {
        if (addresses.length > 0 && selectedAddressId === undefined) {
            const defaultAddress = addresses.find(addr => addr.is_default);
            setSelectedAddressId(defaultAddress?.id || addresses[0].id);
        }
    }, [addresses, selectedAddressId]);

    // Mutación para crear pedido
    const createPedidoMutation = useMutation<PedidoResponse, Error, { direccion_id: number }>({
        mutationFn: createPedidoAction,
        onSuccess: (data) => {
            toast.success('¡Pedido creado exitosamente!');
            // Invalidar queries
            queryClient.invalidateQueries({ queryKey: ['carrito'] });
            queryClient.invalidateQueries({ queryKey: ['pedidos'] });
            // Navegar a página de pago o detalle del pedido
            navigate(`/pedido/${data.id}/pago`);
        },
        onError: (error: any) => {
            console.error('❌ Error completo:', error);
            console.error('❌ Error response:', error?.response);
            console.error('❌ Error data:', error?.response?.data);

            const errorMessage = error?.response?.data?.detail
                || error?.response?.data?.direccion_id?.[0]
                || error?.response?.data?.error
                || error?.message
                || 'Error al crear el pedido';
            toast.error(errorMessage);
        },
    });

    const handleCreatePedido = () => {
        console.log('🔍 selectedAddressId:', selectedAddressId);
        console.log('🔍 cart:', cart);

        if (!selectedAddressId) {
            toast.error('Por favor selecciona una dirección de envío');
            return;
        }

        if (!cart || cart.items.length === 0) {
            toast.error('Tu carrito está vacío');
            return;
        }

        console.log('✅ Intentando crear pedido con direccion_id:', selectedAddressId);
        createPedidoMutation.mutate({
            direccion_id: selectedAddressId,
        });
    };

    if (loadingCart || loadingAddresses) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!cart || cart.items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <ShoppingBag className="h-16 w-16 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Tu carrito está vacío</h2>
                <p className="text-muted-foreground">Agrega productos para realizar un pedido</p>
                <Button onClick={() => navigate('/shop')}>
                    Ir a la tienda
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="max-w-6xl mx-auto px-4">
                <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna izquierda - Direcciones y Pago */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Seleccionar dirección */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Dirección de Envío
                                </CardTitle>
                                <CardDescription>
                                    Selecciona la dirección donde deseas recibir tu pedido
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {addresses.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground mb-4">
                                            No tienes direcciones registradas
                                        </p>
                                        <Button onClick={() => navigate('/perfil/direcciones')}>
                                            Agregar dirección
                                        </Button>
                                    </div>
                                ) : (
                                    <RadioGroup
                                        value={selectedAddressId?.toString() || ''}
                                        onValueChange={(value) => setSelectedAddressId(Number(value))}
                                    >
                                        <div className="space-y-3">
                                            {addresses.map((address) => (
                                                <div
                                                    key={address.id}
                                                    className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                                                >
                                                    <RadioGroupItem value={address.id.toString()} id={`address-${address.id}`} />
                                                    <Label
                                                        htmlFor={`address-${address.id}`}
                                                        className="flex-1 cursor-pointer"
                                                    >
                                                        <div className="font-medium">{address.address_type}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {address.street_address}
                                                            {address.apartment_address && `, ${address.apartment_address}`}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {address.city}, {address.state}, {address.country}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            CP: {address.postal_code}
                                                        </div>
                                                        {address.is_default && (
                                                            <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                                                Por defecto
                                                            </span>
                                                        )}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </RadioGroup>
                                )}
                            </CardContent>
                        </Card>

                        {/* Método de pago */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Método de Pago
                                </CardTitle>
                                <CardDescription>
                                    El pago se procesar después de confirmar el pedido
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Una vez confirmado el pedido, serás redirigido a la página de pago donde podrás seleccionar tu método de pago preferido.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Columna derecha - Resumen del pedido */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-4">
                            <CardHeader>
                                <CardTitle>Resumen del Pedido</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Items */}
                                <div className="space-y-3">
                                    {cart.items.map((item) => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                {item.variante.nombre} × {item.cantidad}
                                            </span>
                                            <span className="font-medium">
                                                ${(Number(item.precio_final) * item.cantidad).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>${cart.total_carrito}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Envío</span>
                                        <span>A calcular</span>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span>${cart.total_carrito}</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handleCreatePedido}
                                    disabled={createPedidoMutation.isPending || !selectedAddressId}
                                >
                                    {createPedidoMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        'Confirmar Pedido'
                                    )}
                                </Button>

                                <p className="text-xs text-center text-muted-foreground">
                                    Al confirmar, aceptas nuestros términos y condiciones
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
