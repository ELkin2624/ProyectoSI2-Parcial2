# carritos/models.py
from django.db import models
from django.conf import settings # Para el modelo User
from ..productos.models import ProductoVariante
import uuid

class Carrito(models.Model):
    """
    Un carrito puede pertenecer a un usuario o a una sesión anónima.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, 
                                   null=True, blank=True, related_name='carrito')
    session_key = models.CharField(max_length=40, db_index=True, 
                                   null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Carrito"
        verbose_name_plural = "Carritos"

    def __str__(self):
        if self.usuario:
            return f"Carrito de {self.usuario.email}"
        return f"Carrito anónimo {self.id}"
    
    @property
    def total_carrito(self):
        """
        Calcula el total de todos los items en el carrito.
        """
        return sum(item.subtotal for item in self.items.all())


class ItemCarrito(models.Model):
    """Un item dentro del carrito."""
    carrito = models.ForeignKey(Carrito, on_delete=models.CASCADE, 
                                related_name='items')
    variante = models.ForeignKey(ProductoVariante, on_delete=models.CASCADE, 
                                 related_name='items_carrito')
    cantidad = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name = "Item de Carrito"
        verbose_name_plural = "Items de Carrito"
        unique_together = ('carrito', 'variante') # No duplicar el mismo item

    def __str__(self):
        return f"{self.cantidad} x {self.variante.producto.nombre}"
    
    @property
    def precio_final(self):
        """
        Devuelve el precio de oferta si existe, 
        si no, el precio regular de la variante.
        """
        if self.variante.precio_oferta:
            return self.variante.precio_oferta
        return self.variante.precio
    
    @property
    def subtotal(self):
        """
        Calcula el subtotal para este item (cantidad * precio_final).
        """
        return self.cantidad * self.precio_final