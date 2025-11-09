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
    QRComprobanteUploadSerializer,
    AdminPagoCreateSerializer,
    AdminPagoSerializer
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
            # Verificar que Stripe esté configurado
            if not settings.STRIPE_SECRET_KEY:
                pago.delete()  # Eliminar el pago creado
                return Response(
                    {"detail": "El método de pago con tarjeta no está disponible. Por favor usa QR/Transferencia."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                # 4. Crear un "Intento de Pago" en Stripe
                # Convertir Decimal a float y luego a centavos
                monto_centavos = int(float(pago.monto) * 100)
                
                intent = stripe.PaymentIntent.create(
                    # El monto debe estar en centavos
                    amount=monto_centavos,
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
                
                # 6. Devolver el client_secret y el pago_id al frontend
                # Tu React usará esto para mostrar el formulario de tarjeta
                return Response(
                    {
                        'client_secret': intent.client_secret,
                        'pago_id': str(pago.id),
                        'payment_intent_id': intent.id
                    },
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


# --- Vista para que el usuario vea sus propios pagos ---
class ConfirmarPagoStripeView(APIView):
    """
    (CLIENTE) Confirma un pago de Stripe desde el frontend.
    Esto es una alternativa temporal al webhook para desarrollo local.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        pago_id = request.data.get('pago_id')
        payment_intent_id = request.data.get('payment_intent_id')

        print(f"🔔 Confirmar Pago Stripe - pago_id: {pago_id}, payment_intent_id: {payment_intent_id}")

        if not pago_id or not payment_intent_id:
            return Response(
                {"detail": "pago_id y payment_intent_id son requeridos."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Verificar que el pago existe y pertenece al usuario
            pago = Pago.objects.get(
                id=pago_id, 
                pedido__usuario=request.user,
                id_transaccion_pasarela=payment_intent_id
            )
            
            print(f"✅ Pago encontrado: {pago.id}, estado actual: {pago.estado}")

            # Verificar con Stripe que el pago fue exitoso
            try:
                intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                print(f"✅ PaymentIntent recuperado de Stripe, status: {intent.status}")
                
                if intent.status == 'succeeded':
                    with transaction.atomic():
                        # Actualizar el estado del Pago
                        pago.estado = Pago.EstadoPago.COMPLETADO
                        pago.save()
                        print(f"✅ Pago actualizado a COMPLETADO: {pago.id}")
                        
                        # Actualizar el estado del Pedido
                        pedido = pago.pedido
                        pedido.estado = Pedido.EstadoPedido.PAGADO
                        pedido.save()
                        print(f"✅ Pedido actualizado a PAGADO: {pedido.id}")
                    
                    return Response(
                        {"detail": "Pago confirmado exitosamente."},
                        status=status.HTTP_200_OK
                    )
                else:
                    return Response(
                        {"detail": f"El pago no está completado. Estado: {intent.status}"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            except stripe.error.StripeError as e:
                return Response(
                    {"detail": f"Error al verificar con Stripe: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        except Pago.DoesNotExist:
            return Response(
                {"detail": "Pago no encontrado o no tienes permiso para acceder."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MisPagosListView(generics.ListAPIView):
    """
    (CLIENTE) Lista todos los pagos del usuario autenticado.
    """
    serializer_class = PagoSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filtra solo los pagos del usuario autenticado."""
        return Pago.objects.filter(
            pedido__usuario=self.request.user
        ).select_related(
            'pedido',
            'pedido__usuario'
        ).order_by('-creado_en')


# --- Vistas de Administración ---
class AdminPagoViewSet(viewsets.ModelViewSet):
    """
    (ADMIN) ViewSet para gestionar todos los pagos.
    Permite leer, crear y actualizar el estado de pagos (aprobar/rechazar QR).
    """
    queryset = Pago.objects.select_related(
        'pedido',
        'pedido__usuario'
    ).all().order_by('-creado_en')
    serializer_class = AdminPagoSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['pedido', 'metodo_pago', 'estado']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']  # GET, POST y PATCH
    
    def get_serializer_class(self):
        """Usa serializer diferente para crear pagos."""
        if self.action == 'create':
            return AdminPagoCreateSerializer
        # Para actualizaciones parciales, usar un serializer mínimo
        if self.action == 'partial_update':
            return PagoSerializer
        return AdminPagoSerializer
    
    def partial_update(self, request, *args, **kwargs):
        """
        Permite al admin cambiar el estado de un pago (aprobar/rechazar QR).
        """
        pago = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado not in ['COMPLETADO', 'FALLIDO']:
            return Response(
                {"detail": "Estado inválido. Use 'COMPLETADO' o 'FALLIDO'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                pago.estado = nuevo_estado
                pago.save()
                
                # Si se aprueba el pago, actualizar el pedido
                if nuevo_estado == 'COMPLETADO':
                    pedido = pago.pedido
                    pedido.estado = Pedido.EstadoPedido.PAGADO
                    pedido.save()
                
                serializer = self.get_serializer(pago)
                return Response(serializer.data)
                
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )