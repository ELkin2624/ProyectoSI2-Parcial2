import stripe # Importamos la librería de Stripe
from django.conf import settings
from django.db import transaction
from rest_framework import generics, permissions, status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Pago
from ..pedidos.models import Pedido
from .serializers import (
    PagoSerializer,
    PagoCreateSerializer,
    QRComprobanteUploadSerializer
)

stripe.api_key = settings.STRIPE_SECRET_KEY

# --- Vistas para el Cliente (Crear y Gestionar Pagos) ---
class PagoCreateView(generics.CreateAPIView):
    """
    (CLIENTE) Inicia un intento de pago.
    - Si es Stripe: Crea un "Payment Intent" y devuelve el client_secret.
    - Si es QR: Simplemente crea el registro de pago pendiente.
    """
    serializer_class = PagoCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # 1. Validar el serializer (revisa que el pedido sea del usuario)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 2. El .save() llama al create() del serializer, que copia el monto
        pago = serializer.save()

        # 3. Lógica según el método de pago
        if pago.metodo_pago == Pago.MetodoPago.STRIPE:
            # --- Lógica de Stripe ---
            try:
                # 4. Crear un "Intento de Pago" en Stripe
                intent = stripe.PaymentIntent.create(
                    # El monto debe estar en centavos
                    amount=int(pago.monto * 100),
                    # TODO: Cambia 'usd' a 'bob' si tu cuenta de Stripe
                    # está configurada para Bolivianos.
                    currency='usd',
                    # Añadimos metadata para saber qué pagar en el webhook
                    metadata={
                        'pedido_id': str(pago.pedido.id),
                        'pago_id': str(pago.id)
                    }
                )
                
                # 5. Guardar el ID de Stripe en nuestro modelo
                pago.id_transaccion_pasarela = intent.id
                pago.save()
                
                # 6. Devolver el client_secret al frontend
                # Tu React usará esto para mostrar el formulario de tarjeta
                return Response(
                    {'client_secret': intent.client_secret},
                    status=status.HTTP_201_CREATED
                )

            except Exception as e:
                # Si Stripe falla, revertimos el pago
                pago.estado = Pago.EstadoPago.FALLIDO
                pago.save()
                return Response(
                    {"detail": f"Error de Stripe: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        elif pago.metodo_pago == Pago.MetodoPago.QR_MANUAL:
            # --- Lógica de QR Manual ---
            # No hay nada más que hacer aquí. Solo creamos el registro
            # y el frontend mostrará la imagen estática del QR.
            read_serializer = PagoSerializer(pago)
            return Response(read_serializer.data, status=status.HTTP_201_CREATED)
        
        else:
            return Response(
                {"detail": "Método de pago no implementado."},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )

class QRComprobanteUploadView(generics.UpdateAPIView):
    """
    (CLIENTE) Sube la imagen del comprobante QR.
    Se usa con PATCH a: /api/pagos/{id}/upload-qr/
    """
    serializer_class = QRComprobanteUploadSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Seguridad: El usuario solo puede actualizar sus propios pagos."""
        return Pago.objects.filter(pedido__usuario=self.request.user)

    def update(self, request, *args, **kwargs):
        # La 'instance' es el Pago que se está actualizando
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        # Guardamos la imagen en el modelo Pago
        pago = serializer.save()
        
        # ¡IMPORTANTE! Actualizamos el estado del Pedido
        try:
            with transaction.atomic():
                pedido = pago.pedido
                # Ponemos el pedido "En Verificación" para que el admin lo revise
                pedido.estado = Pedido.EstadoPedido.EN_VERIFICACION
                pedido.save(update_fields=['estado'])
                
                # También actualizamos el pago (aunque sigue pendiente de admin)
                # (El serializer ya lo validó, así que esto es seguro)
        except Exception as e:
             return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Devolvemos el pago actualizado con la URL de la imagen
        read_serializer = PagoSerializer(pago)
        return Response(read_serializer.data, status=status.HTTP_200_OK)


# --- Vistas del Webhook (Para Stripe) ---
class StripeWebhookView(APIView):
    """
    Vista PÚBLICA (sin permisos) para recibir webhooks de Stripe.
    Stripe nos notificará aquí cuando un pago sea exitoso.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        endpoint_secret = settings.STRIPE_WEBHOOK_SECRET

        try:
            # 1. Verificar la firma del webhook (¡Seguridad!)
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except ValueError as e:
            # Payload inválido
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError as e:
            # Firma inválida
            return Response(status=status.HTTP_400_BAD_REQUEST)

        # 2. Manejar el evento
        
        if event['type'] == 'payment_intent.succeeded':
            intent = event['data']['object'] # El PaymentIntent
            payment_intent_id = intent['id']
            metadata = intent['metadata']
            pago_id = metadata.get('pago_id')
            
            # 3. Lógica de negocio (¡CRÍTICO!)
            try:
                # Usamos una transacción por si algo falla
                with transaction.atomic():
                    # Encontrar el pago en nuestra BD
                    pago = Pago.objects.get(id=pago_id, id_transaccion_pasarela=payment_intent_id)
                    
                    if pago.estado == Pago.EstadoPago.PENDIENTE:
                        # 4. Actualizar el estado del Pago
                        pago.estado = Pago.EstadoPago.COMPLETADO
                        pago.save()
                        
                        # 5. Actualizar el estado del Pedido
                        pedido = pago.pedido
                        pedido.estado = Pedido.EstadoPedido.PAGADO
                        pedido.save()
                    
            except Pago.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        elif event['type'] == 'payment_intent.payment_failed':
            intent = event['data']['object']
            pago_id = intent['metadata'].get('pago_id')
            
            try:
                pago = Pago.objects.get(id=pago_id)
                pago.estado = Pago.EstadoPago.FALLIDO
                pago.save()
            except Pago.DoesNotExist:
                pass # Ignoramos si no lo encontramos
                
        # 6. Devolver 200 OK a Stripe
        return Response(status=status.HTTP_200_OK)


# --- Vistas de Administración (Solo para ver) ---
class AdminPagoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    (ADMIN) ViewSet de solo lectura para ver todos los pagos.
    """
    queryset = Pago.objects.all().order_by('-creado_en')
    serializer_class = PagoSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['pedido', 'metodo_pago', 'estado']