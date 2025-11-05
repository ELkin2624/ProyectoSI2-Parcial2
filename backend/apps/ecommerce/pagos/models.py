from django.db import models
from django.conf import settings
from cloudinary.models import CloudinaryField
from ..pedidos.models import Pedido
import uuid

class Pago(models.Model):
    
    class MetodoPago(models.TextChoices):
        STRIPE = 'STRIPE', 'Stripe (Tarjeta)'
        PAYPAL = 'PAYPAL', 'PayPal'
        QR_MANUAL = 'QR_MANUAL', 'QR (BCP/Ganadero)'
        # Puedes añadir más aquí, ej: TIGO_MONEY, PAGO_CONTRA_ENTREGA

    class EstadoPago(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente' # Ej: Esperando pago de Stripe o QR
        COMPLETADO = 'COMPLETADO', 'Completado' # Pago verificado
        FALLIDO = 'FALLIDO', 'Fallido'       # Tarjeta rechazada, etc.

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Un pedido puede tener varios intentos de pago (ej. uno fallido, uno exitoso)
    pedido = models.ForeignKey(
        Pedido, 
        on_delete=models.CASCADE, 
        related_name='pagos'
    )
    
    # El monto de esta transacción específica
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Qué método se usó
    metodo_pago = models.CharField(
        max_length=20, 
        choices=MetodoPago.choices
    )
    
    # El estado de ESTA transacción
    estado = models.CharField(
        max_length=20, 
        choices=EstadoPago.choices, 
        default=EstadoPago.PENDIENTE
    )
    
    # --- Campos Específicos de la Pasarela ---
    # Para Stripe/PayPal: Guardamos el ID que ellos nos dan
    id_transaccion_pasarela = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        db_index=True,
        help_text="ID de la transacción de Stripe, PayPal, etc."
    )
    
    # Para QR Manual: Guardamos la imagen del comprobante
    comprobante_qr = CloudinaryField(
        'pagos/comprobantes_qr',
        blank=True, 
        null=True,
        help_text="Comprobante de pago para QR (subido por el usuario)"
    )
    
    # Para QR Manual: Notas del admin al verificar
    notas_admin = models.TextField(blank=True, null=True)

    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pago"
        verbose_name_plural = "Pagos"
        ordering = ('-creado_en',)

    def __str__(self):
        return f"Pago {self.id} de {self.monto} para Pedido {self.pedido.id}"