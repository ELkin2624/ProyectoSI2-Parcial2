# /apps/ecommerce/carritos/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# --- Router para Vistas de Items de Carrito ---
# Esto se encargará de:
# POST     /api/carritos/items/       (Añadir item)
# PUT/PATCH /api/carritos/items/{id}/ (Actualizar cantidad)
# DELETE   /api/carritos/items/{id}/ (Quitar item)
router = DefaultRouter()
router.register(r'items', views.CartItemViewSet, basename='cart-item')

urlpatterns = [
    # --- Vista principal del Carrito ---
    # Hacemos que la URL raíz ('') apunte a la acción 'retrieve'
    # que personalizamos en nuestro CartViewSet.
    # GET /api/carritos/ (Muestra el carrito del usuario)
    path('', views.CartViewSet.as_view({'get': 'retrieve'}), name='cart-detail'),
    
    # --- URLs del router (para los items) ---
    path('', include(router.urls)),
]