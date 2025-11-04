from rest_framework import viewsets, permissions
from .models import Almacen, Stock
from .serializers import AlmacenSerializer, StockSerializer

class AlmacenViewSet(viewsets.ModelViewSet):
    """
    (ADMIN) ViewSet para gestionar los Almacenes (Bodegas).
    Permite CRUD completo.
    """
    queryset = Almacen.objects.all()
    serializer_class = AlmacenSerializer
    permission_classes = [permissions.IsAdminUser]

class StockViewSet(viewsets.ModelViewSet):
    """
    (ADMIN) ViewSet para gestionar los registros de Stock.
    Permite CRUD completo (asignar stock a una variante en un almacén).
    """
    queryset = Stock.objects.all().order_by('almacen', 'variante')
    serializer_class = StockSerializer
    permission_classes = [permissions.IsAdminUser]    
    filterset_fields = ['almacen', 'variante']