from django.db import transaction # ¡Para transacciones atómicas!
from django.db.models import F  # Para actualizaciones atómicas
from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from .models import Pedido, ItemPedido, DireccionPedido
from .serializers import (
    PedidoSerializer, 
    PedidoCreateSerializer, 
    PedidoUpdateSerializer,
    AdminPedidoSerializer
)
from apps.ecommerce.carritos.views import get_or_create_cart
from apps.ecommerce.carritos.models import ItemCarrito
from apps.usuarios.models import Address as DireccionUsuario
from apps.ecommerce.inventario.models import Stock


# --- Vistas para el Cliente (Autenticado) ---
class PedidoCreateView(generics.CreateAPIView):
    """
    (CLIENTE) Vista para CREAR un nuevo pedido.
    Implementa la lógica de descuento de stock multi-almacén.
    """
    serializer_class = PedidoCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        direccion_usuario = serializer.validated_data['direccion_id']
        
        carrito = get_or_create_cart(request)
        if carrito.items.count() == 0:
            return Response(
                {"detail": "No puedes crear un pedido con un carrito vacío."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # 3a. Crear el Pedido principal
                pedido = Pedido.objects.create(
                    usuario=request.user,
                    email_cliente=request.user.email,
                    total_pedido=carrito.total_carrito,
                )

                # 3b. Crear el "Snapshot" de la Dirección
                # (Asumimos que el usuario tiene first/last name y phone)
                DireccionPedido.objects.create(
                    pedido=pedido,
                    nombre_completo=f"{direccion_usuario.user.first_name} {direccion_usuario.user.last_name}",
                    calle_direccion=direccion_usuario.street_address,
                    apartamento_direccion=direccion_usuario.apartment_address,
                    ciudad=direccion_usuario.city,
                    region_estado=direccion_usuario.state,
                    pais=direccion_usuario.country,
                    codigo_postal=direccion_usuario.postal_code,
                    telefono=direccion_usuario.user.phone_number
                )
                
                items_para_crear = []
                
                # 3c. Recorrer el carrito
                for item_carrito in carrito.items.all():
                    variante = item_carrito.variante
                    cantidad_requerida = item_carrito.cantidad
                    
                    # 3d. ¡VALIDACIÓN Y LÓGICA DE STOCK MULTI-ALMACÉN!
                    
                    # Primero, una validación rápida usando la @property (suma de todo)
                    if variante.stock_total < cantidad_requerida:
                        raise Exception(f"Stock insuficiente para {variante}. Disponible: {variante.stock_total}")

                    # Segundo, descontar el stock usando lógica de cascada (waterfall)
                    # Bloqueamos todas las filas de stock para esta variante
                    registros_stock = Stock.objects.select_for_update().filter(
                        variante=variante,
                        cantidad__gt=0
                    ).order_by('almacen__id') # Ordenamos para un descuento predecible

                    cantidad_a_descontar = cantidad_requerida
                    
                    for stock_record in registros_stock:
                        if cantidad_a_descontar == 0:
                            break # Ya terminamos de descontar este item

                        if stock_record.cantidad >= cantidad_a_descontar:
                            # Este almacén tiene suficiente stock, descontamos y terminamos
                            stock_record.cantidad = F('cantidad') - cantidad_a_descontar
                            stock_record.save(update_fields=['cantidad'])
                            cantidad_a_descontar = 0
                        else:
                            # Este almacén no tiene suficiente, lo vaciamos y seguimos
                            cantidad_a_descontar -= stock_record.cantidad
                            stock_record.cantidad = 0
                            stock_record.save(update_fields=['cantidad'])
                    
                    # Doble chequeo de seguridad
                    if cantidad_a_descontar > 0:
                        # Esto solo pasaría si el stock_total mintió (carrera de concurrencia)
                        # La transacción se revertirá.
                        raise Exception(f"No se pudo cumplir el pedido por falta de stock (Concurrencia) para {variante}.")

                    # 3f. Preparar el ItemPedido (snapshot de precio)
                    items_para_crear.append(
                        ItemPedido(
                            pedido=pedido,
                            variante=variante,
                            cantidad=item_carrito.cantidad,
                            precio_unitario=item_carrito.precio_final
                        )
                    )
                
                # 3g. Crear todos los items en la BD
                ItemPedido.objects.bulk_create(items_para_crear)
                
                # 3h. Limpiar (borrar) el carrito
                carrito.delete()

        except Exception as e:
            return Response(
                {"detail": f"Error al procesar el pedido: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 4. Devolver el pedido recién creado
        read_serializer = PedidoSerializer(pedido)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

# --- Vistas del Cliente y Admin (Estas se quedan igual) ---
class PedidoClienteViewSet(viewsets.ReadOnlyModelViewSet):
    """
    (CLIENTE) Un ViewSet de solo lectura para que el usuario
    vea su historial de pedidos.
    """
    serializer_class = PedidoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Pedido.objects.filter(usuario=self.request.user)

class AdminPedidoViewSet(viewsets.ModelViewSet):
    """
    (ADMIN) ViewSet para gestionar TODOS los pedidos.
    """
    queryset = Pedido.objects.all().select_related('usuario').prefetch_related('items__variante__producto', 'pagos')
    permission_classes = [permissions.IsAdminUser]
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return PedidoUpdateSerializer
        return AdminPedidoSerializer