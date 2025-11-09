from rest_framework import serializers
from .models import Pago
from ..pedidos.models import Pedido

# --- Serializador de LECTURA ---
class PagoSerializer(serializers.ModelSerializer):
    """
    Serializador de SOLO LECTURA para mostrar los detalles de un pago.
    """
    # Muestra la URL del comprobante si existe
    comprobante_qr_url = serializers.SerializerMethodField()

    class Meta:
        model = Pago
        fields = (
            'id',
            'pedido',
            'monto',
            'metodo_pago',      # Enviamos el valor crudo: STRIPE, QR_MANUAL, etc.
            'estado',           # Enviamos el valor crudo: PENDIENTE, COMPLETADO, FALLIDO
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


class AdminPagoSerializer(serializers.ModelSerializer):
    """
    Serializador de lectura para admin con datos expandidos del pedido y usuario.
    """
    pedido = serializers.SerializerMethodField()
    comprobante_qr_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Pago
        fields = (
            'id',
            'pedido',
            'monto',
            'metodo_pago',
            'estado',
            'id_transaccion_pasarela',
            'comprobante_qr_url',
            'notas_admin',
            'creado_en',
            'actualizado_en'
        )
    
    def get_pedido(self, obj):
        """
        Devuelve el pedido con los datos del usuario expandidos.
        """
        pedido = obj.pedido
        return {
            'id': str(pedido.id),
            'usuario': {
                'id': pedido.usuario.id,
                'email': pedido.usuario.email,
                'first_name': pedido.usuario.first_name,
                'last_name': pedido.usuario.last_name,
            },
            'total_pedido': str(pedido.total_pedido),
            'estado': pedido.estado,
        }
    
    def get_comprobante_qr_url(self, obj):
        if obj.comprobante_qr and hasattr(obj.comprobante_qr, 'url'):
            return obj.comprobante_qr.url
        return None


class AdminPagoCreateSerializer(serializers.ModelSerializer):
    """
    Serializador para que el ADMIN cree un pago manualmente.
    No requiere validación de usuario ya que es creado por el admin.
    """
    pedido_id = serializers.PrimaryKeyRelatedField(
        queryset=Pedido.objects.all(),
        source='pedido',
        write_only=True,
        label="ID del Pedido"
    )

    class Meta:
        model = Pago
        fields = ('pedido_id', 'metodo_pago', 'monto', 'estado')

    def validate(self, attrs):
        pedido = attrs['pedido']
        
        # Validar que el monto no sea mayor al total del pedido
        if attrs.get('monto') and attrs['monto'] > pedido.total_pedido:
            raise serializers.ValidationError("El monto del pago no puede ser mayor al total del pedido.")
            
        return attrs
    
    def create(self, validated_data):
        """
        Crea un pago. Si no se especifica monto, usa el total del pedido.
        """
        pedido = validated_data['pedido']
        
        # Si no se especificó monto, usar el total del pedido
        if 'monto' not in validated_data or not validated_data['monto']:
            validated_data['monto'] = pedido.total_pedido
        
        # Si el pago se crea como COMPLETADO, actualizar el estado del pedido
        pago = Pago.objects.create(**validated_data)
        
        if pago.estado == Pago.EstadoPago.COMPLETADO:
            pedido.estado = Pedido.EstadoPedido.PAGADO
            pedido.save()
        
        return pago