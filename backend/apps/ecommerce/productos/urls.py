# en backend/apps/productos/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# --- Router para Vistas de Administración ---
# Generará /admin/categorias/, /admin/productos/, etc.
router_admin = DefaultRouter()
router_admin.register(r'categorias', views.AdminCategoriaViewSet, basename='admin-categoria')
router_admin.register(r'atributos', views.AdminAtributoViewSet, basename='admin-atributo')
router_admin.register(r'valores', views.AdminValorAtributoViewSet, basename='admin-valor')
router_admin.register(r'productos', views.AdminProductoViewSet, basename='admin-producto')
router_admin.register(r'variantes', views.AdminProductoVarianteViewSet, basename='admin-variante')
router_admin.register(r'imagenes', views.AdminImagenProductoViewSet, basename='admin-imagen')

# --- Lista principal de URLs ---
urlpatterns = [
    # --- Vistas Públicas (Para el Cliente) ---
    # GET /api/productos/categorias/ (Lista de categorías raíz)
    path('categorias/', views.CategoriaPublicListView.as_view(), name='public-categorias'),
    
    # GET /api/productos/productos/ (Catálogo de productos)
    path('productos/', views.ProductoPublicListView.as_view(), name='public-productos'),
    
    # GET /api/productos/productos/<slug>/ (Detalle de un producto)
    path('productos/<slug:slug>/', views.ProductoPublicDetailView.as_view(), name='public-producto-detalle'),

    # --- Vistas de Administración ---
    # Incluye todas las URLs del router de admin bajo el prefijo 'admin/'
    # Ej: GET, POST /api/productos/admin/productos/
    # Ej: GET, PUT /api/productos/admin/productos/<id>/
    path('admin/', include(router_admin.urls)),
]