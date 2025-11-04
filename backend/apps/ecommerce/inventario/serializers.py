from rest_framework import serializers
from .models import Almacen, Stock
from ..productos.models import ProductoVariante

class AlmacenSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Almacen.
    """
    class Meta:
        model = Almacen
        fields = ('id', 'nombre', 'direccion', 'activo')

class StockSerializer(serializers.ModelSerializer):
    """
    Serializador para los registros de Stock.
    Se usará para anidar en la Variante y para la gestión de inventario.
    """
    # Usamos un serializador anidado simple para mostrar el nombre
    # del almacén en lugar de solo su ID.
    almacen = AlmacenSerializer(read_only=True)
    
    # Para escribir (crear/actualizar), aceptamos el ID del almacén.
    almacen_id = serializers.PrimaryKeyRelatedField(
        queryset=Almacen.objects.all(),
        source='almacen',
        write_only=True,
        label="ID del Almacén"
    )
    
    # Para escribir, aceptamos el ID de la variante.
    variante_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductoVariante.objects.all(),
        source='variante',
        write_only=True,
        label="ID de la Variante"
    )

    class Meta:
        model = Stock
        fields = (
            'id', 
            'variante',      # Se mostrará como el __str__ (SKU) en lectura
            'almacen',       # Se mostrará el objeto Almacen en lectura
            'cantidad',
            'almacen_id',    # Campo de solo escritura
            'variante_id'    # Campo de solo escritura
        )
        read_only_fields = ('variante',) # La variante se asigna al crear
        
        # Hacemos la validación de 'unique_together' a nivel de serializador
        validators = [
            serializers.UniqueTogetherValidator(
                queryset=Stock.objects.all(),
                fields=('variante', 'almacen'),
                message="Ya existe un registro de stock para esta variante en este almacén."
            )
        ]

    # Hacemos que 'variante' sea de solo lectura en las
    # actualizaciones anidadas, pero escribible al crear.
    def to_representation(self, instance):
        representation = super().to_representation(self, instance)
        representation['almacen'] = AlmacenSerializer(instance.almacen).data
        representation['variante'] = str(instance.variante) 
        return representation