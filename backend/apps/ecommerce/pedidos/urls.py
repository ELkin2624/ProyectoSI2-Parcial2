# /apps/ecommerce/pedidos/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# --- Router para Vistas de Cliente (Leer historial) ---
# GET /api/pedidos/
# GET /api/pedidos/{id}/
router_cliente = DefaultRouter()
router_cliente.register(r'', views.PedidoClienteViewSet, basename='pedido-cliente')

# --- Router para Vistas de Administración ---
router_admin = DefaultRouter()
router_admin.register(r'', views.AdminPedidoViewSet, basename='admin-pedido')

# --- Lista principal de URLs de la app ---
urlpatterns = [
    # --- Vista de Creación para el Cliente ---
    # POST /api/pedidos/crear/
    path('crear/', views.PedidoCreateView.as_view(), name='pedido-crear'),

    # --- Vistas de Administración ---
    # /api/pedidos/admin/
    path('admin/', include(router_admin.urls)),
    
    # --- Vistas de Cliente (Listar y Ver) ---
    path('', include(router_cliente.urls)),
]