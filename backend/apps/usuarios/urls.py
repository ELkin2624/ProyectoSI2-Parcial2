# en backend/apps/usuarios/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# --- Router para Vistas de Cliente "Mi Cuenta" ---
# Este router agrupa las vistas bajo el prefijo /me/
# Generará: /api/usuarios/me/addresses/
router_me = DefaultRouter()
router_me.register(r'addresses', views.AddressViewSet, basename='user-address')

# --- Router para Vistas de Administración ---
# Este router agrupa las vistas bajo el prefijo /admin/
# Generará: /api/usuarios/admin/usuarios/, /api/usuarios/admin/perfiles/, etc.
router_admin = DefaultRouter()
router_admin.register(r'usuarios', views.AdminUserViewSet, basename='admin-user')
router_admin.register(r'perfiles', views.AdminProfileViewSet, basename='admin-profile')
router_admin.register(r'direcciones', views.AdminAddressViewSet, basename='admin-address')


# --- Lista principal de URLs de la app ---
urlpatterns = [
    # --- Registro Público ---
    # POST /api/usuarios/registro/
    path('registro/', views.UserRegistrationView.as_view(), name='user-registration'),

    # --- Gestión "Mi Cuenta" (Usuario logueado) ---
    # GET, PUT, PATCH /api/usuarios/me/
    path('me/', views.ManageUserView.as_view(), name='manage-user'),
    # GET, PUT, PATCH /api/usuarios/me/profile/
    path('me/profile/', views.ManageProfileView.as_view(), name='manage-profile'),
    
    # --- URLs del router "Mi Cuenta" (para /me/addresses/) ---
    path('me/', include(router_me.urls)),

    # --- URLs del router "Admin" ---
    path('admin/', include(router_admin.urls)),
]