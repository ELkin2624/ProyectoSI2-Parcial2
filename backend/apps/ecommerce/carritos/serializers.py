from rest_framework import serializers
from .models import Carrito, ItemCarrito
from ..productos.models import ProductoVariante

# --- Serializadores para LEER el Carrito (Mostrar al cliente) ---

class CartProductVariantSerializer(serializers.ModelSerializer):
    """
    Serializador SÚPER LIGERO para mostrar los detalles de la variante
    DENTRO del carrito. No queremos mostrar el stock o mil detalles.
    """
    # Tomamos el nombre del producto padre
    nombre = serializers.CharField(source='producto.nombre')
    # Tomamos la URL de la imagen de la variante
    imagen_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ProductoVariante
        fields = (
            'id', 
            'nombre', 
            'sku', 
            'imagen_url',
        )

    def get_imagen_url(self, obj):
        if obj.imagen_variante and hasattr(obj.imagen_variante, 'url'):
            return obj.imagen_variante.url
        # Fallback a la galería del producto principal si no hay imagen de variante
        imagen_principal = obj.producto.imagenes.filter(es_principal=True).first()
        if imagen_principal:
            return imagen_principal.imagen.url
        return None

class ItemCarritoSerializer(serializers.ModelSerializer):
    """
    Serializador para MOSTRAR un item del carrito.
    Incluye los detalles de la variante y los subtotales calculados.
    """
    # Usamos el serializador ligero de arriba para 'variante'
    variante = CartProductVariantSerializer(read_only=True)
    
    # Exponemos las @property que creamos en el modelo
    precio_final = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ItemCarrito
        fields = (
            'id', 
            'variante', 
            'cantidad', 
            'precio_final', # Precio unitario (con oferta si aplica)
            'subtotal'      # Precio * Cantidad
        )

class CarritoSerializer(serializers.ModelSerializer):
    """
    Serializador principal para MOSTRAR el carrito completo.
    Anida todos sus items y muestra el total.
    """
    # Usamos 'items' (el related_name) y el serializador de arriba
    items = ItemCarritoSerializer(many=True, read_only=True)
    
    # Exponemos la @property del modelo Carrito
    total_carrito = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Carrito
        fields = (
            'id', 
            'usuario', 
            'session_key', 
            'items',          # La lista de items
            'total_carrito'   # El costo total
        )
        read_only_fields = ('id', 'usuario', 'session_key', 'items', 'total_carrito')


# --- Serializadores para ESCRIBIR en el Carrito (Añadir/Actualizar) ---

class AddItemCarritoSerializer(serializers.ModelSerializer):
    """
    Serializador SÓLO para AÑADIR o ACTUALIZAR un item.
    Espera el ID de la variante y la cantidad.
    """
    variante_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductoVariante.objects.filter(activo=True),
        source='variante',
        write_only=True,
        label="ID de la Variante"
    )

    class Meta:
        model = ItemCarrito
        fields = ('variante_id', 'cantidad')
    
    def validate(self, attrs):
        # Validamos el stock ANTES de añadir al carrito
        variante = attrs['variante']
        cantidad = attrs['cantidad']
        stock_total = variante.stock_total
        
        if cantidad > stock_total:
            raise serializers.ValidationError(
                f"No hay suficiente stock. Disponible: {stock_total}, Solicitado: {cantidad}"
            )
        return attrs