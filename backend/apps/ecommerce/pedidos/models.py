# orders/models.py
from django.db import models
from django.conf import settings
from productos.models import ProductoVariante

class Pedido(models.Model):
    class EstadoPedido(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente de Pago'
        PAGADO = 'PAGADO', 'Pagado'
        ENVIADO = 'ENVIADO', 'Enviado'
        ENTREGADO = 'ENTREGADO', 'Entregado'
        CANCELADO = 'CANCELADO', 'Cancelado'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                                null=True, blank=True, related_name='pedidos')
    # Guardar datos del cliente por si se elimina la cuenta
    email_cliente = models.EmailField()
    
    # Relación con la dirección
    direccion_envio = models.ForeignKey('DireccionEnvio', on_delete=models.SET_NULL, 
                                        null=True, related_name='pedidos_envio')
    
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
    
    # Guardamos el precio al momento de la compra
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, 
                                         help_text="Precio al momento de la compra")

    class Meta:
        verbose_name = "Item de Pedido"
        verbose_name_plural = "Items de Pedido"
        
    def __str__(self):
        return f"{self.cantidad} x {self.variante.producto.nombre} en Pedido {self.pedido.id}"

class DireccionEnvio(models.Model):
    """Direcciones guardadas por los usuarios."""
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, 
                                related_name='direcciones')
    nombre_completo = models.CharField(max_length=255)
    calle_direccion = models.CharField(max_length=255)
    ciudad = models.CharField(max_length=100)
    region_estado = models.CharField(max_length=100)
    codigo_postal = models.CharField(max_length=20)
    pais = models.CharField(max_length=100)
    telefono = models.CharField(max_length=20, blank=True)
    es_predeterminada = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Dirección de Envío"
        verbose_name_plural = "Direcciones de Envío"
        unique_together = ('usuario', 'calle_direccion', 'ciudad', 'codigo_postal')

    def __str__(self):
        return f"Dirección de {self.usuario.username} en {self.ciudad}"