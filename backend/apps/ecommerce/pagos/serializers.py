from rest_framework import serializers
from .models import Pago
from ..pedidos.models import Pedido

# --- Serializador de LECTURA ---
class PagoSerializer(serializers.ModelSerializer):
    """
    Serializador de SOLO LECTURA para mostrar los detalles de un pago.
    """
    # Muestra los valores legibles (ej: "Stripe (Tarjeta)")
    metodo_pago = serializers.CharField(source='get_metodo_pago_display')
    estado = serializers.CharField(source='get_estado_display')
    
    # Muestra la URL del comprobante si existe
    comprobante_qr_url = serializers.SerializerMethodField()

    class Meta:
        model = Pago
        fields = (
            'id',
            'pedido',
            'monto',
            'metodo_pago',
            'estado',
            'id_transaccion_pasarela', # El ID de Stripe/PayPal
            'comprobante_qr_url',      # La URL de la foto del QR
            'creado_en',
            'actualizado_en'
        )
    
    def get_comprobante_qr_url(self, obj):
        if obj.comprobante_qr and hasattr(obj.comprobante_qr, 'url'):
            return obj.comprobante_qr.url
        return None


# --- Serializadores de ESCRITURA ---
class PagoCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para INICIAR un nuevo pago.
    Toma el ID del pedido y el método de pago.
    """
    pedido_id = serializers.PrimaryKeyRelatedField(
        queryset=Pedido.objects.filter(estado=Pedido.EstadoPedido.PENDIENTE),
        source='pedido',
        write_only=True,
        label="ID del Pedido"
    )

    class Meta:
        model = Pago
        fields = ('pedido_id', 'metodo_pago')

    def validate(self, attrs):
        pedido = attrs['pedido']
        request = self.context.get('request')
        
        # 1. Validar que el pedido pertenezca al usuario
        if not request or pedido.usuario != request.user:
            raise serializers.ValidationError("Este pedido no pertenece al usuario actual.")
        
        # 2. Validar que el pedido esté 'PENDIENTE'
        if pedido.estado != Pedido.EstadoPedido.PENDIENTE:
            raise serializers.ValidationError("Este pedido ya ha sido procesado o está en verificación.")
            
        return attrs
    
    def create(self, validated_data):
        """
        Sobrescribe 'create' para copiar el monto del pedido al pago.
        """
        pedido = validated_data['pedido']
        
        # Copiamos el total del pedido al monto del pago
        pago = Pago.objects.create(
            pedido=pedido,
            monto=pedido.total_pedido, # Copia el total
            metodo_pago=validated_data['metodo_pago'],
            estado=Pago.EstadoPago.PENDIENTE # Estado inicial
        )
        return pago

class QRComprobanteUploadSerializer(serializers.ModelSerializer):
    """
    Serializador SÓLO para subir el comprobante QR.
    Se aplica a un pago 'QR_MANUAL' que ya existe.
    """
    comprobante_qr = serializers.ImageField(required=True)

    class Meta:
        model = Pago
        fields = ('comprobante_qr',)

    def validate(self, attrs):
        # 'instance' es el objeto Pago que se está actualizando
        if self.instance.metodo_pago != Pago.MetodoPago.QR_MANUAL:
            raise serializers.ValidationError("Este pago no es de tipo QR_MANUAL.")
        
        if self.instance.estado != Pago.EstadoPago.PENDIENTE:
            raise serializers.ValidationError("Este pago ya ha sido procesado.")
            
        return attrs