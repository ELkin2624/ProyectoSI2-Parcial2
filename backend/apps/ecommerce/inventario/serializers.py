from rest_framework import serializers
from .models import Almacen, Stock
from ..productos.models import ProductoVariante

class AlmacenSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Almacen.
    """
    # Agregar alias para mantener compatibilidad
    ubicacion = serializers.CharField(source='direccion', required=False, allow_blank=True)
    capacidad = serializers.IntegerField(default=0)
    
    class Meta:
        model = Almacen
        fields = ('id', 'nombre', 'direccion', 'ubicacion', 'capacidad', 'activo')

class VarianteSimpleSerializer(serializers.ModelSerializer):
    """
    Serializador simple de variante con información del producto.
    """
    producto = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductoVariante
        fields = ('id', 'sku', 'producto')
    
    def get_producto(self, obj):
        return {
            'id': obj.producto.id,
            'nombre': obj.producto.nombre
        }

class StockSerializer(serializers.ModelSerializer):
    """
    Serializador para los registros de Stock.
    Se usará para anidar en la Variante y para la gestión de inventario.
    """
    # Para lectura, mostrar objetos completos
    almacen = AlmacenSerializer(read_only=True)
    variante = VarianteSimpleSerializer(read_only=True)
    
    # Para escritura, aceptar IDs
    almacen_id = serializers.PrimaryKeyRelatedField(
        queryset=Almacen.objects.all(),
        source='almacen',
        write_only=True,
        label="ID del Almacén",
        required=False
    )
    
    variante_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductoVariante.objects.all(),
        source='variante',
        write_only=True,
        label="ID de la Variante",
        required=False
    )

    class Meta:
        model = Stock
        fields = (
            'id', 
            'variante',      # Se mostrará el objeto VarianteSimple en lectura
            'almacen',       # Se mostrará el objeto Almacen en lectura
            'cantidad',
            'almacen_id',    # Campo de solo escritura
            'variante_id'    # Campo de solo escritura
        )
        
        # Validación de 'unique_together' a nivel de serializador
        validators = [
            serializers.UniqueTogetherValidator(
                queryset=Stock.objects.all(),
                fields=('variante', 'almacen'),
                message="Ya existe un registro de stock para esta variante en este almacén."
            )
        ]