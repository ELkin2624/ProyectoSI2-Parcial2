# ecommerce/pedidos/models.py
from django.db import models
from django.conf import settings
from apps.ecommerce.productos.models import ProductoVariante
import uuid


class DireccionPedido(models.Model):
    """
    Un "snapshot" (copia congelada) de la dirección en el
    momento exacto de la compra. ESTO NUNCA SE MODIFICA.
    No tiene FK a User, solo a Pedido.
    """
    # Usamos OneToOne porque un pedido solo tiene UNA dirección de envío
    pedido = models.OneToOneField(
        'Pedido', 
        on_delete=models.CASCADE, 
        related_name='direccion_envio'
    )
    
    # Copiamos todos los campos del modelo Address de la app usuarios
    nombre_completo = models.CharField(max_length=255, blank=True)
    calle_direccion = models.CharField(max_length=255)
    apartamento_direccion = models.CharField(max_length=100, blank=True, null=True)
    ciudad = models.CharField(max_length=100)
    region_estado = models.CharField(max_length=100) # O provincia/departamento
    pais = models.CharField(max_length=100)
    codigo_postal = models.CharField(max_length=20)
    telefono = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        verbose_name = "Dirección de Pedido"
        verbose_name_plural = "Direcciones de Pedido"

    def __str__(self):
        return f"Dirección para el Pedido {self.pedido.id}"
    

class Pedido(models.Model):
    class EstadoPedido(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente de Pago'
        EN_VERIFICACION = 'EN_VERIFICACION', 'En Verificación de Pago' # Para QR
        PAGADO = 'PAGADO', 'Pagado'
        ENVIADO = 'ENVIADO', 'Enviado'
        ENTREGADO = 'ENTREGADO', 'Entregado'
        CANCELADO = 'CANCELADO', 'Cancelado'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                                null=True, blank=True, related_name='pedidos')
    # Guardar datos del cliente por si se elimina la cuenta
    email_cliente = models.EmailField()
    
    total_pedido = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, choices=EstadoPedido.choices, 
                              default=EstadoPedido.PENDIENTE)
    
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"
        ordering = ('-creado_en',)

    def __str__(self):
        return f"Pedido {self.id} - {self.email_cliente}"

class ItemPedido(models.Model):
    """Los productos específicos comprados en un pedido."""
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='items')
    variante = models.ForeignKey(ProductoVariante, on_delete=models.PROTECT,
                                 help_text="Usamos PROTECT para no borrar items de pedidos pasados")
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, 
                                         help_text="Precio al momento de la compra")

    class Meta:
        verbose_name = "Item de Pedido"
        verbose_name_plural = "Items de Pedido"
        
    def __str__(self):
        return f"{self.cantidad} x {self.variante.producto.nombre} en Pedido {self.pedido.id}"
    
    @property
    def subtotal(self):
        return self.cantidad * self.precio_unitario

