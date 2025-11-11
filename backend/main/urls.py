from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from rest_framework_simplejwt.views import (
      TokenObtainPairView,
      TokenRefreshView,
)
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="Documentación de API para una Boutique",  # Título de tu API
      default_version='v1',
      description="Descripción de la API de mi proyecto Boutique ",
   ),
   public=True,
   permission_classes=(permissions.AllowAny,), # Permite que cualquiera vea la doc
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('api/usuarios/', include('apps.usuarios.urls')),
    path('api/productos/', include('apps.ecommerce.productos.urls')),
    path('api/inventario/', include('apps.ecommerce.inventario.urls')),
    path('api/carritos/', include('apps.ecommerce.carritos.urls')),
    path('api/pedidos/', include('apps.ecommerce.pedidos.urls')),
    path('api/pagos/', include('apps.ecommerce.pagos.urls')),
    path('api/ia/', include('apps.ia_services.urls')),
]
