# en backend/apps/ecommerce/inventario/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Todas estas vistas son solo para el admin
router = DefaultRouter()
router.register(r'almacenes', views.AlmacenViewSet, basename='almacen')
router.register(r'stock', views.StockViewSet, basename='stock')

urlpatterns = [
    # Esto generará:
    # /api/inventario/almacenes/
    # /api/inventario/stock/
    path('', include(router.urls)),
]