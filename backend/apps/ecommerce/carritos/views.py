from rest_framework import viewsets, permissions, status, mixins
from rest_framework.response import Response
from .models import Carrito, ItemCarrito
from .serializers import (
    CarritoSerializer, 
    ItemCarritoSerializer, 
    AddItemCarritoSerializer
)

# --- Función de Ayuda Clave ---
def get_or_create_cart(request):
    """
    Función de ayuda para obtener o crear un carrito.
    Maneja usuarios autenticados, anónimos y la FUSIÓN de carritos.
    """
    cart = None
    if request.user.is_authenticated:
        # --- 1. Usuario Autenticado ---
        session_key = request.session.session_key
        anonymous_cart = None
        
        # 1a. ¿Tiene un carrito anónimo de ESTA sesión?
        if session_key:
            try:
                anonymous_cart = Carrito.objects.get(session_key=session_key)
            except Carrito.DoesNotExist:
                pass
        
        # 1b. Obtener (o crear) el carrito permanente del usuario
        try:
            # 1c. El usuario YA tiene un carrito.
            cart = Carrito.objects.get(usuario=request.user)
            
            # 1d. ¡LÓGICA DE FUSIÓN!
            # Si encontramos un carrito anónimo, pasamos sus items
            # al carrito permanente del usuario.
            if anonymous_cart and anonymous_cart.id != cart.id:
                for item in anonymous_cart.items.all():
                    # Comprobar si el item ya existe en el carrito del usuario
                    existing_item, created = ItemCarrito.objects.get_or_create(
                        carrito=cart, 
                        variante=item.variante,
                        defaults={'cantidad': item.cantidad}
                    )
                    # Si ya existía, sumar las cantidades
                    if not created:
                        existing_item.cantidad += item.cantidad
                        existing_item.save()
                    # Borrar item del carrito anónimo
                    item.delete()
                # Borrar carrito anónimo vacío
                anonymous_cart.delete()
                
        except Carrito.DoesNotExist:
            # 1e. El usuario NO tiene carrito.
            if anonymous_cart:
                # El carrito anónimo se convierte en su carrito ("reclamado").
                anonymous_cart.usuario = request.user
                anonymous_cart.session_key = None
                anonymous_cart.save()
                cart = anonymous_cart
            else:
                # No hay carrito anónimo, crear uno nuevo para el usuario.
                cart = Carrito.objects.create(usuario=request.user)
                
    else:
        # --- 2. Usuario Anónimo ---
        if not request.session.session_key:
            request.session.create()
        session_key = request.session.session_key
        
        # 2a. Obtener (o crear) el carrito de la sesión
        cart, created = Carrito.objects.get_or_create(session_key=session_key)
        
    return cart


# --- ViewSets ---
class CartViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Un ViewSet para MOSTRAR el carrito.
    Solo proporciona la acción 'retrieve' (GET) personalizada.    
    """
    queryset = Carrito.objects.all()
    serializer_class = CarritoSerializer
    permission_classes = [permissions.AllowAny] # Cualquiera puede ver su carrito

    def retrieve(self, request, *args, **kwargs):
        """
        Sobrescribe 'retrieve' para no usar un PK en la URL.
        Devuelve el carrito del usuario (autenticado o anónimo).
        """
        # La función de ayuda hace todo el trabajo pesado
        cart = get_or_create_cart(request)
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

class CartItemViewSet(mixins.CreateModelMixin,
                      mixins.UpdateModelMixin,
                      mixins.DestroyModelMixin,
                      viewsets.GenericViewSet):
    """
    Un ViewSet para GESTIONAR los items DENTRO de un carrito.
    Permite: añadir, actualizar y eliminar items.
    """
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """
Filtra los items para que solo pertenezcan al carrito del usuario actual.
        """
        cart = get_or_create_cart(self.request)
        return ItemCarrito.objects.filter(carrito=cart)

    def get_serializer_class(self):
        """
        Usa AddItemCarritoSerializer para crear/actualizar
        y ItemCarritoSerializer para todo lo demás (aunque no se usa).
        """
        if self.action in ['create', 'update', 'partial_update']:
            return AddItemCarritoSerializer
        return ItemCarritoSerializer # Por defecto

    def create(self, request, *args, **kwargs):
        """
        Sobrescribe 'create' para manejar la lógica de "añadir o actualizar cantidad".
        """
        cart = get_or_create_cart(request)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        variante = serializer.validated_data['variante']
        cantidad = serializer.validated_data['cantidad']
        
        # Lógica de "Get or Create" con actualización de cantidad
        existing_item, created = ItemCarrito.objects.get_or_create(
            carrito=cart,
            variante=variante,
            defaults={'cantidad': cantidad}
        )
        
        if not created:
            # El item ya existía. Actualizar cantidad.
            # Volver a validar el stock con la cantidad TOTAL.
            total_cantidad = existing_item.cantidad + cantidad
            if total_cantidad > variante.stock_total:
                return Response(
                    {"detail": f"No hay suficiente stock. Disponible: {variante.stock_total}, Solicitado: {total_cantidad}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            existing_item.cantidad = total_cantidad
            existing_item.save()
        
        # Devolver el estado del carrito completo y actualizado
        cart_serializer = CarritoSerializer(cart)
        return Response(cart_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """
        Sobrescribe 'update' para actualizar la cantidad de un item.
        Si la cantidad es 0, borra el item.
        """
        # get_object() usará get_queryset(), asegurando que el item
        # pertenece al carrito del usuario actual.
        instance = self.get_object() 
        
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.pop('partial', False))
        serializer.is_valid(raise_exception=True)
        
        cantidad = serializer.validated_data.get('cantidad', instance.cantidad)
        
        if cantidad <= 0:
            # Si la cantidad es 0 o negativa, borrar el item
            self.perform_destroy(instance)
            # Devolver el estado del carrito actualizado
            cart = get_or_create_cart(request)
            cart_serializer = CarritoSerializer(cart)
            return Response(cart_serializer.data, status=status.HTTP_200_OK)
        else:
            # El 'validate' del AddItemCarritoSerializer ya comprobó el stock
            serializer.save()
            
        # Devolver el estado del carrito completo y actualizado
        cart = get_or_create_cart(request)
        cart_serializer = CarritoSerializer(cart)
        return Response(cart_serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Sobrescribe 'destroy' para devolver el estado del carrito completo.
        """
        instance = self.get_object()
        self.perform_destroy(instance)
        
        # Devolver el estado del carrito actualizado
        cart = get_or_create_cart(request)
        cart_serializer = CarritoSerializer(cart)
        return Response(cart_serializer.data, status=status.HTTP_200_OK)