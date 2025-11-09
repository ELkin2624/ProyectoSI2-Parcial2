import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { confirmarPagoStripeAction } from "@/shop/actions/pagos.action";

interface StripeCheckoutFormProps {
    onSuccess: () => void;
    amount: string;
    pagoId: string;
    paymentIntentId: string;
}

export const StripeCheckoutForm = ({ onSuccess, amount, pagoId, paymentIntentId }: StripeCheckoutFormProps) => {
    const stripe = useStripe();
    const elements = useElements();
    const queryClient = useQueryClient();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/payment-success`,
                },
                redirect: 'if_required',
            });

            if (error) {
                toast.error(error.message || 'Error al procesar el pago');
                console.error('Stripe error:', error);
            } else {
                // Pago confirmado en Stripe, ahora confirmar en nuestro backend
                try {
                    await confirmarPagoStripeAction(pagoId, paymentIntentId);

                    // Invalidar el caché de React Query para que se actualice la lista de pagos
                    queryClient.invalidateQueries({ queryKey: ['mis-pagos'] });
                    queryClient.invalidateQueries({ queryKey: ['pedido', pagoId] });

                    toast.success('¡Pago procesado exitosamente!');
                    onSuccess();
                } catch (confirmError: any) {
                    console.error('Error al confirmar pago en backend:', confirmError);
                    toast.error('El pago se procesó pero hubo un error al actualizar el estado');
                    // Aún así llamamos onSuccess para que el usuario pueda ver su pedido
                    onSuccess();
                }
            }
        } catch (error: any) {
            toast.error('Error inesperado al procesar el pago');
            console.error('Payment error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total a pagar:</span>
                    <span className="text-2xl font-bold">${amount}</span>
                </div>
            </div>

            <PaymentElement />

            <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!stripe || isProcessing}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando pago...
                    </>
                ) : (
                    `Pagar $${amount}`
                )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
                🔒 Pago seguro procesado por Stripe
            </p>
        </form>
    );
};
