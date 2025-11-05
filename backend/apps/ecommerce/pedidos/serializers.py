from rest_framework import serializers
from .models import Pedido, ItemPedido, DireccionPedido
from apps.usuarios.models import Address as DireccionUsuario
from ..carritos.serializers import CartProductVariantSerializer
from apps.ecommerce.pagos.serializers import PagoSerializer

# --- Serializadores de LECTURA (Para mostrar el pedido al cliente) ---
class DireccionPedidoSerializer(serializers.ModelSerializer):
    """
    Serializador para mostrar la "copia congelada" de la dirección
    que se guardó con el pedido.
    """
    class Meta:
        model = DireccionPedido
        fields = (
            'nombre_completo',
            'calle_direccion',
            'apartamento_direccion',
            'ciudad',
            'region_estado',
            'pais',
            'codigo_postal',
            'telefono'
        )

class ItemPedidoSerializer(serializers.ModelSerializer):
    """
    Serializador para mostrar los items dentro de un pedido.
    """
    # Usamos el serializador ligero de variante que ya teníamos,
    # así mostramos el nombre, SKU e imagen del producto.
    variante = CartProductVariantSerializer(read_only=True)    
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ItemPedido
        fields = (
            'id',
            'variante',
            'cantidad',
            'precio_unitario', # El precio "snapshot" que guardamos
            'subtotal'
        )

class PedidoSerializer(serializers.ModelSerializer):
    """
    Serializador principal para MOSTRAR un pedido completo al cliente.
    """
    # Usamos los related_names
    items = ItemPedidoSerializer(many=True, read_only=True)
    direccion_envio = DireccionPedidoSerializer(read_only=True)    
    estado = serializers.CharField(source='get_estado_display')
    pagos = PagoSerializer(many=True, read_only=True)

    class Meta:
        model = Pedido
        fields = (
            'id',
            'usuario',
            'email_cliente',
            'estado',
            'total_pedido',
            'creado_en',
            'direccion_envio', 
            'items',
            'pagos'  
        )
        read_only_fields = fields


# --- Serializadores de ESCRITURA (Para crear y actualizar) ---
class PedidoCreateSerializer(serializers.Serializer):
    """
    Serializador de SOLO ESCRITURA para CREAR un nuevo pedido.
    El único dato que acepta es el ID de la dirección del usuario.
    La lógica real (copiar carrito, etc.) se hará en la VISTA.
    """
    direccion_id = serializers.PrimaryKeyRelatedField(
        queryset=DireccionUsuario.objects.all(),
        write_only=True,
        label="ID de la Dirección de Envío"
    )

    def validate(self, attrs):
        # Nos aseguramos de que la dirección pertenezca al usuario
        # que está haciendo la petición.
        direccion = attrs.get('direccion_id')
        request = self.context.get('request')
        
        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError("Usuario no autenticado.")
        
        if direccion.user != request.user:
            raise serializers.ValidationError("Esta dirección no pertenece al usuario actual.")
            
        return attrs


class PedidoUpdateSerializer(serializers.ModelSerializer):
    """
    Serializador simple para que el ADMIN actualice el estado de un pedido.
    """
    class Meta:
        model = Pedido
        fields = ('estado',)