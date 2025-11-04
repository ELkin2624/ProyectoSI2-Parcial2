# /ecommerce/inventario/models.py
from django.db import models
from ..productos.models import ProductoVariante 

class Almacen(models.Model):
    """Define tus almacenes físicos o lógicos."""
    nombre = models.CharField(max_length=100, unique=True, 
                              help_text="Ej: Tienda Principal, Bodega Online")
    direccion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Almacén"
        verbose_name_plural = "Almacenes"

    def __str__(self):
        return self.nombre

class Stock(models.Model):
    """
    Modelo 'a través de' que conecta una Variante con un Almacén
    y guarda la cantidad de stock.
    """
    variante = models.ForeignKey(ProductoVariante, on_delete=models.CASCADE, 
                                 related_name='stock_records')
    almacen = models.ForeignKey(Almacen, on_delete=models.CASCADE, 
                                related_name='stock_records')
    cantidad = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Registro de Stock"
        verbose_name_plural = "Registros de Stock"
        unique_together = ('variante', 'almacen')

    def __str__(self):
        return f"{self.cantidad} de {self.variante.sku} en {self.almacen.nombre}"